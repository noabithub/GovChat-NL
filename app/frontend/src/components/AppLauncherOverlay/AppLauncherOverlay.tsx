import React from "react";
import { Icon } from "@fluentui/react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AppLauncherOverlay.module.css";

interface AppLauncherOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const apps = [
    { name: "Chat", icon: "OfficeChat", path: "/" },
    { name: "B1 Taalniveau", icon: "People", path: "/b1-taalniveau" },
    { name: "Subsidies", icon: "DocumentApproval" },
    { name: "Grafieken bouwer", icon: "LineChart" },
    { name: "Data Engineer", icon: "CommandPrompt" },
    { name: "Samenvatten", icon: "ReadingMode" }
];

export const AppLauncherOverlay: React.FC<AppLauncherOverlayProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    if (!isOpen) return null;

    const handleAppClick = (app: { name: string; icon: string; path?: string }) => {
        if (app.path) {
            // Als we al op de huidige pagina zijn, sluit dan alleen de overlay
            if (location.pathname === app.path) {
                onClose();
            } else {
                // Anders navigeer naar de nieuwe pagina en sluit de overlay
                navigate(app.path);
                onClose();
            }
        } else {
            // Optioneel: voeg hier een melding toe voor apps zonder pad
            console.log(`No path defined for ${app.name}`);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                {apps.map((app, index) => (
                    <button key={index} className={styles.appButton} onClick={() => handleAppClick(app)}>
                        <Icon iconName={app.icon} className={styles.appIcon} />
                        <span>{app.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
