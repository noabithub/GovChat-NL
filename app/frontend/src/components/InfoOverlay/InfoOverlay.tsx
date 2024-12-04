import React from "react";
import { Icon } from "@fluentui/react";

import styles from "./InfoOverlay.module.css";

interface InfoOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InfoSection {
    title: string;
    icon: string;
    content: string;
    preserveLineBreaks?: boolean;
}

const infoSections: InfoSection[] = [
    { title: "Starten van een chat", icon: "Chat", content: "Type uw vraag in het invoerveld, of kies een van de voorgestelde vragen om de chat te beginnen." },
    {
        title: "Veiligheid",
        icon: "Shield",
        content: "LAICA draait in een veilige omgeving van de Provincie Limburg."
    },
    {
        title: "Kennisbanken",
        icon: "Library",
        content:
            "Standaard staat er rechtsboven 'Geen' kennisbank geselecteerd. In deze modus baseert LAICA antwoorden op algemene kennis. Er zijn specifieke kennisbanken beschikbaar, zoals 'P&O' of 'Beleidskaders'. Deze bevatten Provinciale documenten."
    },
    {
        title: "Documenten uploaden",
        icon: "Upload",
        content: "U kunt zelf documenten uploaden, die worden bewaard in de kennisbank 'Uploads'."
    },
    {
        title: "Werking van kennisbanken",
        icon: "DataManagementSettings",
        content:
            "Wanneer u een kennisbank selecteert of documenten uploadt, worden deze in kleine stukjes geknipt. Bij het stellen van een vraag zoekt het systeem naar de meest relevante stukjes om uw vraag te beantwoorden. Hierdoor is het niet mogelijk om een volledige samenvatting van een heel document te genereren. Voor een volledige samenvatting kunt u de tekst het beste kopiëren en plakken in de chat."
    },
    { title: "Toegankelijkheid", icon: "TextBox", content: "LAICA is voorzien van een voice-input en voorleesmodus voor collega's met een beperking." },
    {
        title: "Hulp en ondersteuning",
        icon: "ContactCard",
        content: "Voor hulp of uitleg kunt u contact opnemen via AI@prvlimburg.nl."
    },
    {
        title: "Veelgestelde vragen (FAQ)",
        icon: "SurveyQuestions",
        content:
            "1. Wie kan mijn chats zien?\nAntwoord: Niemand, zelfs niet de beheerder. Uw chats zijn privé.\n\n2. Wie kan mijn geüploade bestanden zien?\nAntwoord: Alleen uzelf, en in theorie de beheerder.\n\n3. Waarom LAICA gebruiken?\nAntwoord: LAICA is veiliger dan publieke AI-tools en is verrijkt met provinciale data, wat het bijzonder geschikt maakt voor vragen over de Provincie Limburg.",
        preserveLineBreaks: true
    },
    {
        title: "Vuistregels voor vragen stellen",
        icon: "Lightbulb",
        content:
            "Top 5 met voorbeelden (goede en slechte vraag):\n\n1. Wees specifiek:\nGoed: 'Wat zijn de belangrijkste punten van het Limburgse klimaatbeleid voor 2023?'\nSlecht: 'Vertel me over het klimaat.'\n\n2. Geef context:\nGoed: 'Ik ben nieuw bij de afdeling P&O. Wat zijn de belangrijkste HR-procedures die ik moet kennen?'\nSlecht: 'Wat moet ik weten?'\n\n3. Vraag één ding tegelijk:\nGoed: 'Wat is het budget voor infrastructuur in 2023?'\nSlecht: 'Wat is het budget voor infrastructuur, onderwijs en cultuur voor de komende 5 jaar?'\n\n4. Gebruik kernwoorden:\nGoed: 'Verklaar de term 'omgevingsvisie' in de context van ruimtelijke ordening.'\nSlecht: 'Wat betekent dat ding over ruimte?'\n\n5. Wees beleefd maar bondig:\nGoed: 'Geef een overzicht van de laatste wijzigingen in het thuiswerkbeleid.'\nSlecht: 'Hallo, zou u zo vriendelijk willen zijn om mij alstublieft een uitgebreid overzicht te geven van alle mogelijke veranderingen die er recent zijn geweest in het beleid omtrent het werken vanuit huis? Bij voorbaat dank voor uw moeite.'",
        preserveLineBreaks: true
    },
    {
        title: "Technische informatie",
        icon: "Code",
        content:
            "LAICA gebruikt momenteel GPT-4o als taalmodel. Het model heeft een maximaal aantal input tokens van X (ongeveer Y woorden). Het maximaal aantal output tokens is Z (ongeveer z woorden)."
    }
];

export const InfoOverlay: React.FC<InfoOverlayProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <Icon iconName="Cancel" className={styles.closeIcon} />
                </button>
                <h2 className={styles.title}>Instructies voor het gebruik van LAICA</h2>
                {infoSections.map((section, index) => (
                    <div key={index} className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Icon iconName={section.icon} className={styles.sectionIcon} />
                            {section.title}
                        </h3>
                        {section.preserveLineBreaks ? (
                            <pre className={styles.sectionContent}>{section.content}</pre>
                        ) : (
                            <p className={styles.sectionContent}>{section.content}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
