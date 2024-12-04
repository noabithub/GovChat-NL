import React from "react";
import { Dropdown, IDropdownOption, IDropdownStyles } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { useTranslation } from "react-i18next";
import styles from "./IncludeCategoryButton.module.css";

interface IncludeCategoryButtonProps {
    includeCategory: string;
    onChange: (value: string) => void;
}

export const IncludeCategoryButton: React.FC<IncludeCategoryButtonProps> = ({ includeCategory, onChange }) => {
    const { t } = useTranslation();
    const fieldId = useId("includeCategoryField");

    const dropdownStyles: Partial<IDropdownStyles> = {
        dropdown: { className: styles.dropdown },
        title: { className: styles.title },
        caretDown: { className: styles.caretDown },
        root: { className: styles.dropdownContainer }
    };

    const handleCategoryChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
        if (option) {
            onChange(option.key as string);
        }
    };

    const options: IDropdownOption[] = [
        { key: "__NONE__", text: t("Geen kennisbank") },
        { key: "user_upload", text: t("Mijn Uploads") }
        // { key: "p_o", text: t("P&O") }
    ];

    return <Dropdown id={fieldId} selectedKey={includeCategory} options={options} onChange={handleCategoryChange} styles={dropdownStyles} />;
};
