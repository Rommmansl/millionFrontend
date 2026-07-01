import React, { useState, useEffect } from 'react';

const SearchInput = ({ value = '', onChange, placeholder = "Search by ID or name..." }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [debouncedTerm, setDebouncedTerm] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);// 3 секунды, чтобы удостовериться, что печатать закончил

        return () => {
            clearTimeout(timer);
        };
    }, [searchTerm]);

    useEffect(() => {
        if (onChange) {
            onChange(debouncedTerm);
        }
    }, [debouncedTerm, onChange]);

    return (
        <div className="search-input">
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-field"
            />
        </div>
    );
};

export default SearchInput;