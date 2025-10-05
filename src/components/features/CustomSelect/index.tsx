'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './customSelect.module.css';

interface OptionType {
    value: string;
    label: string;
    icon: React.ReactNode;
}

interface CustomSelectProps {
    options: OptionType[];
    value?: string;
    onChange?: (value: string) => void;
}

export function CustomSelect(props: CustomSelectProps) {
    const { options, value, onChange } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<OptionType>(
        options.find(opt => opt.value === value) || options[0] || { value: '', label: '', icon: null }
    );
    const selectRef = useRef<HTMLDivElement>(null);

    // Atualizar selectedOption quando value prop mudar
    useEffect(() => {
        if (value) {
            const option = options.find(opt => opt.value === value);
            if (option) {
                setSelectedOption(option);
            }
        }
    }, [value, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option: typeof options[0]) => {
        setSelectedOption(option);
        setIsOpen(false);
        
        // Chamar onChange se fornecido
        if (onChange) {
            onChange(option.value);
        }
    };

    return (
        <div className={styles.customSelect} ref={selectRef}>
            <button className={styles.selectButton} onClick={() => setIsOpen(!isOpen)}>
                <span className={styles.selectedIcon}>{selectedOption.icon}</span>
                <span>{selectedOption.label}</span>
            </button>
            {isOpen && (
                <ul className={styles.optionsList}>
                    {options.map((option) => (
                        <li
                            key={option.value}
                            className={styles.option}
                            onClick={() => handleSelect(option)}
                        >
                            <span className={styles.optionIcon}>{option.icon}</span>
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
