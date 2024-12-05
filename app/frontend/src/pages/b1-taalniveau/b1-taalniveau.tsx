import React, { useState, useRef } from "react";
import styles from "./b1-taalniveau.module.css";
import { readFile as apiReadFile } from "../../api";
import { ReadFileResult } from "../../api/models";
import { AppLauncherButton } from "../../components/AppLauncherButton/AppLauncherButton";
import { AppLauncherOverlay } from "../../components/AppLauncherOverlay/AppLauncherOverlay";

const B1Taalniveau: React.FC = () => {
    const [originalContent, setOriginalContent] = useState<string | null>(null);
    const [simplifiedContent, setSimplifiedContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAppLauncherOpen, setIsAppLauncherOpen] = useState<boolean>(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);

            try {
                const result: ReadFileResult = await apiReadFile(file);
                setOriginalContent(result.original_content);
                setSimplifiedContent(result.simplified_content || "Vereenvoudigde inhoud is nog niet beschikbaar.");
            } catch (error) {
                console.error("Error processing file:", error);
                setOriginalContent(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
                setSimplifiedContent(null);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={styles.container}>
            <div className={styles.appLauncherContainer}>
                <AppLauncherButton onClick={() => setIsAppLauncherOpen(true)} />
            </div>
            <div className={styles.uploadSection}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept=".pdf,.doc,.docx,.txt" />
                <button onClick={handleButtonClick} className={styles.uploadButton}>
                    Upload bestand
                </button>
            </div>
            <div className={styles.contentSection}>
                <div className={styles.originalContentSection}>
                    <h3>Originele Inhoud:</h3>
                    {isLoading ? (
                        <div className={styles.loadingSpinner}></div>
                    ) : originalContent ? (
                        <pre className={styles.contentText}>{originalContent}</pre>
                    ) : (
                        <p>Upload een document om de originele inhoud te zien.</p>
                    )}
                </div>
                <div className={styles.simplifiedContentSection}>
                    <h3>Vereenvoudigde Inhoud (B1 Niveau):</h3>
                    {isLoading ? (
                        <div className={styles.loadingSpinner}></div>
                    ) : simplifiedContent ? (
                        <pre className={styles.contentText}>{simplifiedContent}</pre>
                    ) : (
                        <p>Vereenvoudigde inhoud zal hier verschijnen na verwerking.</p>
                    )}
                </div>
            </div>
            <AppLauncherOverlay isOpen={isAppLauncherOpen} onClose={() => setIsAppLauncherOpen(false)} />
        </div>
    );
};

export default B1Taalniveau;
