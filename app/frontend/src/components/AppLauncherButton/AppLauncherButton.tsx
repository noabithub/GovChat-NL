import { AppFolderRegular } from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";

import styles from "./AppLauncherButton.module.css";

interface Props {
    className?: string;
    onClick: () => void;
}

export const AppLauncherButton = ({ className, onClick }: Props) => {
    const { t } = useTranslation();
    return (
        <div className={`${styles.container} ${className ?? ""}`}>
            <Button icon={<AppFolderRegular />} onClick={onClick}>
                {"App Launcher"}
            </Button>
        </div>
    );
};
