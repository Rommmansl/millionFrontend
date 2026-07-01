import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (fetchFunction, search = '') => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    const pageRef = useRef(1);
    const loadingRef = useRef(false);
    const abortControllerRef = useRef(null);
    const containerRef = useRef(null);

    const loadPage = async (page, currentSearch, reset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetchFunction(page, currentSearch, controller.signal);
            if (controller.signal.aborted) return;

            const data = response.data;
            if (reset) {
                setItems(data.items);
            } else {
                setItems(prev => [...prev, ...data.items]);
            }
            setHasMore(data.hasMore);
            setTotal(data.total);
            pageRef.current = page + 1;
        } catch (error) {
            if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
                console.error('Ошибка загрузки:', error);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
                loadingRef.current = false;
            }
        }
    };

    // Сброс при смене поиска
    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setItems([]);
        setHasMore(true);
        setTotal(0);
        pageRef.current = 1;
        loadingRef.current = false;
        loadPage(1, search, true);
    }, [search]);

    // Обработчик скролла контейнера
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el || loadingRef.current || !hasMore) return;

        // Проверяем, что до низа осталось меньше 50px
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
            loadPage(pageRef.current, search, false);
        }
    }, [hasMore, search]);

    // Вешаем обработчик на контейнер
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const refresh = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setItems([]);
        setHasMore(true);
        setTotal(0);
        pageRef.current = 1;
        loadingRef.current = false;
        loadPage(1, search, true);
    };

    return { items, loading, hasMore, total, refresh, containerRef };
};

export default useInfiniteScroll;