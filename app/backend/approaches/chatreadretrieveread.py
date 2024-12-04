from typing import Any, Coroutine, List, Literal, Optional, Union, overload

from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorQuery
from openai import AsyncOpenAI, AsyncStream
from openai.types.chat import (
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionMessageParam,
    ChatCompletionToolParam,
)
from openai_messages_token_helper import build_messages, get_token_limit

from approaches.approach import ThoughtStep
from approaches.chatapproach import ChatApproach
from core.authentication import AuthenticationHelper


class ChatReadRetrieveReadApproach(ChatApproach):
    """
    A multi-step approach that first uses OpenAI to turn the user's question into a search query,
    then uses Azure AI Search to retrieve relevant documents, and then sends the conversation history,
    original user question, and search results to OpenAI to generate a response.
    """

    def __init__(
        self,
        *,
        search_client: SearchClient,
        auth_helper: AuthenticationHelper,
        openai_client: AsyncOpenAI,
        chatgpt_model: str,
        chatgpt_deployment: Optional[str],  # Not needed for non-Azure OpenAI
        embedding_deployment: Optional[str],  # Not needed for non-Azure OpenAI or for retrieval_mode="text"
        embedding_model: str,
        embedding_dimensions: int,
        sourcepage_field: str,
        content_field: str,
        query_language: str,
        query_speller: str,
    ):
        self.search_client = search_client
        self.openai_client = openai_client
        self.auth_helper = auth_helper
        self.chatgpt_model = chatgpt_model
        self.chatgpt_deployment = chatgpt_deployment
        self.embedding_deployment = embedding_deployment
        self.embedding_model = embedding_model
        self.embedding_dimensions = embedding_dimensions
        self.sourcepage_field = sourcepage_field
        self.content_field = content_field
        self.query_language = query_language
        self.query_speller = query_speller
        self.chatgpt_token_limit = get_token_limit(chatgpt_model, default_to_minimum=self.ALLOW_NON_GPT_MODELS)

    @property
    def system_message_chat_conversation(self):
        return """
        Je bent de Limburgse AI Chat Assistent (LAICA), een geavanceerde AI-assistent ontwikkeld voor ambtenaren bij de Provincie Limburg. Je functie is om efficiënte, accurate en neutrale ondersteuning te bieden.

        Kernprincipes
        Taalgebruik: Communiceer standaard in het Nederlands, tenzij expliciet anders gevraagd.
        Status: Je bevindt je in de testfase en bent beperkt beschikbaar.
        Neutraliteit: Blijf altijd neutraal en vermijd politieke of ideologische uitspraken.
        Gegevensbescherming: Waarschuw bij het delen van bijzondere of gevoelige persoonsgegevens en benadruk privacy.
        Ondersteuning: Herinner gebruikers eraan dat je een AI-assistent bent, ontworpen om te ondersteunen maar niet om menselijke expertise of besluitvorming te vervangen.

        Interfacegids
        Linksboven: Bekijk chathistorie of start een nieuwe chat.
        Rechtsboven: Selecteer de kennisbank, upload bestanden, of bekijk instructies.

        Werking LAICA
        Technologie: Gebaseerd op GPT-4o, binnen een veilige en afgesloten omgeving van de Provincie Limburg.
        Tekstverwerking:
        LAICA ondersteunt gebruikers bij het kiezen van de beste aanpak voor hun vraag of opdracht:

        Directe invoer in de chat:
        Geschikt voor:
        - Het samenvatten van documenten.
        - Het vergelijken van meerdere teksten.
        - Algemene of uitgebreide analyses op basis van een volledige tekst.
        Waarom?
        Bij directe invoer analyseert LAICA de tekst in zijn geheel, wat zorgt voor een meer samenhangende en nauwkeurige interpretatie.


        Uploaden van bestanden naar de kennisbank:
        Geschikt voor:
        - Het vinden van specifieke informatie, zoals details of antwoorden op gerichte vragen.
        - Het doorzoeken van lange documenten waarin je gerichte inzichten wilt ophalen.
        Waarom?
        Geüploade documenten worden automatisch in kleine fragmenten (‘chunks’) opgedeeld. Dit is efficiënt voor het zoeken naar specifieke details, maar minder geschikt voor globale analyses of samenvattingen omdat slechts een deel van het document tegelijk toegankelijk is.
        Let op: Je kunt de geüploade bestanden pas bevragen als je bij kennisbank "Mijn uploads" selecteert.

        Zwakte:
        Feitelijke informatie die niet gebaseerd is op een bron uit de kennisbank kan soms onjuist of onnauwkeurig zijn. Bij twijfel, raadpleeg een betrouwbare bron of een collega.

        Gedrag bij begroeting:
        Wanneer een gebruiker alleen een begroeting stuurt, geef een korte uitleg over wat LAICA is en hoe het werkt. Bespreek de technologie (taalmodel, afgesloten omgeving), het gebruik van kennisbanken (inclusief de mogelijkheid om bestanden te uploaden), en de gebruikersinterface.

        Feedback op prompting:
        Geef korte, constructieve feedback over hoe de vraagstelling verbeterd kan worden als dat een significant beter antwoord oplevert, maar doseer dit om te voorkomen dat het irritant wordt voor de gebruiker.

        Contact
        Voor vragen of suggesties: AI@prvlimburg.nl

        Methodologie:
        Benader elke vraag methodisch en grondig. Neem de tijd om stapsgewijs te redeneren en overweeg alle aspecten zorgvuldig om tot een weloverwogen en nauwkeurig antwoord te komen.

        {sources_reference_content}
        {follow_up_questions_prompt}
        {injected_prompt}
        """

    @overload
    async def run_until_final_call(
        self,
        messages: list[ChatCompletionMessageParam],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: Literal[False],
    ) -> tuple[dict[str, Any], Coroutine[Any, Any, ChatCompletion]]: ...

    @overload
    async def run_until_final_call(
        self,
        messages: list[ChatCompletionMessageParam],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: Literal[True],
    ) -> tuple[dict[str, Any], Coroutine[Any, Any, AsyncStream[ChatCompletionChunk]]]: ...

    async def apply_rag(
        self, original_user_query: str, overrides: dict[str, Any], auth_claims: dict[str, Any]
    ) -> tuple[str, dict[str, Any]]:
        use_text_search = overrides.get("retrieval_mode") in ["text", "hybrid", None]
        use_vector_search = overrides.get("retrieval_mode") in ["vectors", "hybrid", None]
        use_semantic_ranker = overrides.get("semantic_ranker", False)
        use_semantic_captions = overrides.get("semantic_captions", False)
        top = overrides.get("top", 3)
        minimum_search_score = overrides.get("minimum_search_score", 0.2)
        minimum_reranker_score = overrides.get("minimum_reranker_score", 0.0)
        filter = self.build_filter(overrides, auth_claims)

        vectors = [await self.compute_text_embedding(original_user_query)]

        results = await self.search(
            top,
            original_user_query,
            filter,
            vectors,
            use_text_search,
            use_vector_search,
            use_semantic_ranker,
            use_semantic_captions,
            minimum_search_score,
            minimum_reranker_score,
        )

        sources_content = self.get_sources_content(results, use_semantic_captions, use_image_citation=False)
        content = "\n".join(sources_content)

        extra_info = {
            "data_points": {"text": sources_content},
            "thoughts": [
                ThoughtStep(
                    "Search results",
                    [result.serialize_for_results() for result in results],
                )
            ],
        }

        return content, extra_info

    async def run_until_final_call(
        self,
        messages: list[ChatCompletionMessageParam],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: bool = False,
    ) -> tuple[dict[str, Any], Coroutine[Any, Any, Union[ChatCompletion, AsyncStream[ChatCompletionChunk]]]]:
        seed = overrides.get("seed", None)

        original_user_query = messages[-1]["content"]
        if not isinstance(original_user_query, str):
            raise ValueError("The most recent message content must be a string.")

        apply_rag = overrides.get("include_category") != "__NONE__"
        content = ""
        extra_info = {"thoughts": [], "data_points": []}

        sources_reference_content = (
            """
        De chatbot mag alleen antwoorden op basis van de opgehaalde bronnen uit de geselecteerde kennisbank.
        Elke bron heeft een naam gevolgd door een dubbele punt en de daadwerkelijke informatie. Vermeld altijd de naam van de bron voor elk feit dat je gebruikt in je antwoord. Gebruik vierkante haken om naar de bron te verwijzen, bijvoorbeeld [info1.txt]. Combineer bronnen niet; vermeld elke bron apart, bijvoorbeeld [info1.txt][info2.pdf].
        Als de benodigde informatie niet beschikbaar is in de geselecteerde kennisbank, geeft de chatbot aan dat hij het niet kan beantwoorden op basis van de beschikbare bronnen.
        """
            if apply_rag
            else ""
        )

        if apply_rag:
            content, rag_extra_info = await self.apply_rag(original_user_query, overrides, auth_claims)
            extra_info.update(rag_extra_info)

        system_message = self.get_system_prompt(
            overrides.get("prompt_template"),
            self.follow_up_questions_prompt_content if overrides.get("suggest_followup_questions") else "",
            sources_reference_content=sources_reference_content,
        )

        response_token_limit = 1024
        messages = build_messages(
            model=self.chatgpt_model,
            system_prompt=system_message,
            past_messages=messages[:-1],
            new_user_content=original_user_query + ("\n\nSources:\n" + content if content else ""),
            max_tokens=self.chatgpt_token_limit - response_token_limit,
            fallback_to_default=self.ALLOW_NON_GPT_MODELS,
        )

        extra_info["thoughts"].append(
            ThoughtStep(
                "Prompt to generate answer",
                messages,
                (
                    {"model": self.chatgpt_model, "deployment": self.chatgpt_deployment}
                    if self.chatgpt_deployment
                    else {"model": self.chatgpt_model}
                ),
            )
        )

        chat_coroutine = self.openai_client.chat.completions.create(
            model=self.chatgpt_deployment if self.chatgpt_deployment else self.chatgpt_model,
            messages=messages,
            temperature=overrides.get("temperature", 0.3),
            max_tokens=response_token_limit,
            n=1,
            stream=should_stream,
            seed=seed,
        )
        return (extra_info, chat_coroutine)
