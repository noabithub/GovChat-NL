import { ChatHelp24Regular } from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";

import styles from "./InfoButton.module.css";

interface Props {
    className?: string;
    onClick: () => void;
}

export const InfoButton = ({ className, onClick }: Props) => {
    const { t } = useTranslation();
    return (
        <div className={`${styles.container} ${className ?? ""}`}>
            <Button icon={<ChatHelp24Regular />} onClick={onClick}>
                {"Info"}
            </Button>
        </div>
    );
};
