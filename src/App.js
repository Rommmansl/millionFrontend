import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ItemList from './components/ItemList';
import SearchInput from './components/SearchInput';
import useInfiniteScroll from './hooks/useInfiniteScroll';
import {
    getItems,
    getSelectedItems,
    addItem,
    selectItem,
    removeSelected,
    updateOrder,
    getState
} from './services/api';
import './App.css';

function App() {
    const [searchLeft, setSearchLeft] = useState('');
    const [searchRight, setSearchRight] = useState('');
    const [selectedOrder, setSelectedOrder] = useState([]);

    // Бесконечная прокрутка для левой панели
    const {
        items: allItems,
        loading: loadingAll,
        hasMore: hasMoreAll,
        total: totalAll,
        refresh: refreshAll,
        containerRef: leftContainerRef
    } = useInfiniteScroll(getItems, searchLeft);

    // Бесконечная прокрутка для правой панели
    const {
        items: selectedItems,
        loading: loadingSelected,
        hasMore: hasMoreSelected,
        total: totalSelected,
        refresh: refreshSelected,
        containerRef: rightContainerRef
    } = useInfiniteScroll(getSelectedItems, searchRight);

    // Загрузка сохранённого порядка выбранных при старте
    useEffect(() => {
        getState()
            .then(res => setSelectedOrder(res.data.selectedOrder || []))
            .catch(console.error);
    }, []);

    // Сортировка отображаемых выбранных элементов согласно selectedOrder
    const orderedSelectedItems = useMemo(() => {
        if (!selectedOrder || selectedOrder.length === 0) return selectedItems;
        const orderMap = new Map(selectedOrder.map((id, index) => [id, index]));
        return [...selectedItems].sort((a, b) => {
            const aIdx = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
            const bIdx = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
            return aIdx - bIdx;
        });
    }, [selectedItems, selectedOrder]);

    // Обработчики действий
    const handleAddItem = async (id, name) => {
        await addItem(id, name);
        refreshAll();
    };

    const handleSelectItem = async (id) => {
        await selectItem(id);
        refreshAll();
        refreshSelected();
        const state = await getState();
        setSelectedOrder(state.data.selectedOrder);
    };

    const handleRemoveSelected = async (id) => {
        await removeSelected(id);
        refreshAll();
        refreshSelected();
        const state = await getState();
        setSelectedOrder(state.data.selectedOrder);
    };

    const handleDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination || destination.droppableId !== 'selected-items') return;
        if (source.index === destination.index) return;

        const movedId = orderedSelectedItems[source.index].id;
        const newOrder = Array.from(selectedOrder);

        // Удаляем перемещаемый id из старого порядка
        const oldIndex = newOrder.indexOf(movedId);
        if (oldIndex !== -1) newOrder.splice(oldIndex, 1);

        // Вставляем на новую позицию относительно видимых элементов
        if (destination.index === 0) {
            // Вставка перед первым видимым элементом
            const firstVisibleId = orderedSelectedItems[0].id;
            const firstPos = newOrder.indexOf(firstVisibleId);
            newOrder.splice(firstPos, 0, movedId);
        } else {
            // Вставка после элемента, который теперь будет на destination.index - 1
            const targetId = orderedSelectedItems[destination.index].id;
            const targetPos = newOrder.indexOf(targetId);
            newOrder.splice(targetPos, 0, movedId);
        }

        setSelectedOrder(newOrder);

        try {
            await updateOrder(newOrder);
            refreshSelected();
        } catch (error) {
            console.error('Ошибка обновления порядка:', error);
            const state = await getState();
            setSelectedOrder(state.data.selectedOrder);
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="app">
                <header className="app-header">
                    <h1>Менеджер миллиона элементов</h1>
                    <div className="stats">
                        <span>Всего доступно: {totalAll.toLocaleString()}</span>
                        <span>Выбрано: {totalSelected.toLocaleString()}</span>
                    </div>
                </header>

                <div className="main-container">
                    <div className="panel-wrapper">
                        <ItemList
                            items={allItems}
                            loading={loadingAll}
                            onAddNewItem={handleAddItem}
                            onSelectItem={handleSelectItem}
                            search={searchLeft}
                            onSearchChange={setSearchLeft}
                            title="Все элементы"
                            containerRef={leftContainerRef}
                        />
                    </div>

                    <div className="panel-wrapper">
                        <div className="item-list right-panel">
                            <div className="panel-header">
                                <h2>Выбранные элементы ({totalSelected})</h2>
                                <div className="panel-actions">
                                    <SearchInput
                                        value={searchRight}
                                        onChange={setSearchRight}
                                        placeholder="Поиск по ID..."
                                    />
                                </div>
                            </div>

                            <Droppable droppableId="selected-items">
                                {(provided, snapshot) => (
                                    <div
                                        ref={(node) => {
                                            provided.innerRef(node);
                                            rightContainerRef.current = node;
                                        }}
                                        {...provided.droppableProps}
                                        className={`items-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                    >
                                        {orderedSelectedItems.length === 0 && !loadingSelected ? (
                                            <div className="empty-state">
                                                Нажмите «Выбрать» в левой панели, чтобы добавить элементы
                                            </div>
                                        ) : (
                                            orderedSelectedItems.map((item, index) => (
                                                <Draggable
                                                    key={item.id.toString()}
                                                    draggableId={item.id.toString()}
                                                    index={index}
                                                    isDragDisabled={!!searchRight}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`item-card selected ${snapshot.isDragging ? 'dragging' : ''}`}
                                                        >
                                                            <div className="item-info">
                                                                <span className="item-id">
                                                                    #{item.id.toString().padStart(7, '0')}
                                                                </span>
                                                                <span className="item-name">{item.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveSelected(item.id)}
                                                                className="remove-btn"
                                                                title="Удалить из выбранных"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                        {loadingSelected && (
                                            <div className="loading-indicator">
                                                <div className="spinner"></div>
                                                Загрузка...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    </div>
                </div>
            </div>
        </DragDropContext>
    );
}

export default App;