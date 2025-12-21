/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    className = '',
    disabled = false,
    error,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search query
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.sublabel && option.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
        } else if (e.key === 'Enter' && filteredOptions.length === 1) {
            handleSelect(filteredOptions[0].value);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Select Button/Input */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    relative flex items-center justify-between w-full px-3 py-2
                    border rounded-md shadow-sm cursor-pointer
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                    ${error ? 'border-red-500' : 'border-gray-300'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    ${className}
                `}
            >
                <div className="flex-1 flex items-center space-x-2 min-w-0">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type to search..."
                            className="w-full outline-none bg-transparent text-sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`truncate text-sm ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
                            {selectedOption ? (
                                <>
                                    {selectedOption.label}
                                    {selectedOption.sublabel && (
                                        <span className="text-gray-500 ml-1">({selectedOption.sublabel})</span>
                                    )}
                                </>
                            ) : (
                                placeholder
                            )}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    {selectedOption && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 hover:bg-gray-200 rounded"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    )}
                    <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((option) => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        px-3 py-2 cursor-pointer text-sm
                                        ${option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900 hover:bg-gray-100'}
                                    `}
                                >
                                    <div className="font-medium">{option.label}</div>
                                    {option.sublabel && (
                                        <div className="text-xs text-gray-500">{option.sublabel}</div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            No results found for "{searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
