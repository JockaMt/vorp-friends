'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './customSelect.module.css';

interface OptionType {
    value: string;
    label: string;
    icon: React.ReactNode;
}

export function CustomSelect(props: { options: OptionType[] }) {
    const { options } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<OptionType>(options[0] || { value: '', label: '', icon: null });
    const selectRef = useRef<HTMLDivElement>(null);

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
