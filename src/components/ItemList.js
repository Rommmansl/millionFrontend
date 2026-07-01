import React, { useState } from 'react';
import SearchInput from './SearchInput';

const ItemList = ({ 
    items = [],
    loading = false,
    onAddNewItem,
    onSelectItem,
    search = '',
    onSearchChange,
    title = "Элементы",
    containerRef
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemId, setNewItemId] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [addError, setAddError] = useState('');

    const handleAddItem = async () => {
        if (!newItemId.trim()) {
            setAddError('ID обязателен');
            return;
        }
        const id = parseInt(newItemId, 10);
        if (isNaN(id) || id < 1) {
            setAddError('ID должен быть положительным числом');
            return;
        }
        try {
            await onAddNewItem(id, newItemName.trim());
            setNewItemId('');
            setNewItemName('');
            setAddError('');
            setShowAddForm(false);
        } catch (error) {
            setAddError(error.response?.data?.error || 'Ошибка добавления');
        }
    };

    return (
        <div className={`item-list left-panel ${loading ? 'loading' : ''}`}>
            <div className="panel-header">
                <h2>{title}</h2>
                <div className="panel-actions">
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="add-btn"
                    >
                        {showAddForm ? 'Отмена' : '+ Добавить'}
                    </button>
                </div>
            </div>

            {onSearchChange && (
                <div className="search-section">
                    <SearchInput
                        value={search}
                        onChange={onSearchChange}
                        placeholder="Поиск по ID..."
                    />
                </div>
            )}

            {showAddForm && (
                <div className="add-form">
                    <div className="form-row">
                        <input
                            type="number"
                            placeholder="Уникальный ID"
                            value={newItemId}
                            onChange={e => { setNewItemId(e.target.value); setAddError(''); }}
                            min="1"
                            className={addError ? 'error' : ''}
                        />
                        <input
                            type="text"
                            placeholder="Название (необязательно)"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                        />
                    </div>
                    {addError && <div className="error-message">{addError}</div>}
                    <div className="form-actions">
                        <button onClick={handleAddItem} className="submit-btn">
                            Добавить элемент
                        </button>
                        <button onClick={() => {
                            setShowAddForm(false);
                            setAddError('');
                        }} className="cancel-btn">
                            Отмена
                        </button>
                    </div>
                </div>
            )}

            <div className="items-container" ref={containerRef}>
                {items.length === 0 && !loading ? (
                    <div className="empty-state">
                        {search ? 'Элементы не найдены.' : 'Нет элементов для отображения.'}
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="item-card">
                            <div className="item-info">
                                <span className="item-id">
                                    #{item.id.toString().padStart(7, '0')}
                                </span>
                                <span className="item-name">{item.name}</span>
                            </div>
                            <button
                                onClick={() => onSelectItem(item.id)}
                                className="select-btn"
                            >
                                Выбрать
                            </button>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="loading-indicator">
                        <div className="spinner"></div>
                        Загрузка элементов...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemList;