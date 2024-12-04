import { Example } from "./Example";
import { useTranslation } from "react-i18next";

import styles from "./Example.module.css";

interface Props {
    onExampleClicked: (value: string) => void;
    useGPT4V?: boolean;
}

export const ExampleList = ({ onExampleClicked, useGPT4V }: Props) => {
    const { t } = useTranslation();

    const DEFAULT_EXAMPLES: string[] = [t("defaultExamples.1"), t("defaultExamples.2"), t("defaultExamples.3"), t("defaultExamples.4")];
    const GPT4V_EXAMPLES: string[] = [t("gpt4vExamples.1"), t("gpt4vExamples.2"), t("gpt4vExamples.3"), t("gpt4vExamples.4")];

    const examples = useGPT4V ? GPT4V_EXAMPLES : DEFAULT_EXAMPLES;

    return (
        <div className={styles.examplesGrid}>
            {examples.map((example, index) => (
                <Example key={index} text={example} value={example} onClick={onExampleClicked} />
            ))}
        </div>
    );
};
