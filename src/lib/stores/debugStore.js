import { writable } from 'svelte/store';

function createDebugStore() {
    const initialState = {
        logs: [], // 디버그 로그 배열
        maxLogs: 100 // 최대 로그 수
    };

    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        addLog: (log) => {
            update(state => {
                const newLogs = [...state.logs, {
                    ...log,
                    id: Date.now() + Math.random(),
                    timestamp: new Date().toISOString()
                }];
                // 최대 로그 수를 초과하면 오래된 로그 제거
                if (newLogs.length > state.maxLogs) {
                    newLogs.shift();
                }
                return { ...state, logs: newLogs };
            });
        },
        clearLogs: () => {
            update(state => ({ ...state, logs: [] }));
        },
        setMaxLogs: (max) => {
            update(state => ({ ...state, maxLogs: max }));
        }
    };
}

export const debugStore = createDebugStore();



