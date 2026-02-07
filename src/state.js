// state.js - 状態管理とLocalStorage
// Phase 1: コード基盤整備

import { CONFIG, createDefaultTimelineData, defaultPhaseConfig } from './config.js';

/**
 * アプリケーション状態
 * V3 State Structure:
 * {
 *   activeTimelineId: "uuid",
 *   globalHolidays: [],
 *   timelines: [{ id, name, data: { anchorDate, phases, ... } }]
 * }
 */
export let appState = {
    activeTimelineId: null,
    globalHolidays: [],
    timelines: []
};

/**
 * グローバル祝日を取得（dateUtils用）
 */
export function getGlobalHolidays() {
    return appState.globalHolidays || [];
}

/**
 * 状態をLocalStorageに保存
 */
export function saveState() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
}

/**
 * LocalStorageから状態を読み込み
 */
export function loadState() {
    const rawNew = localStorage.getItem(CONFIG.STORAGE_KEY);
    const rawOld = localStorage.getItem(CONFIG.OLD_STORAGE_KEY);

    if (rawNew) {
        try {
            const parsed = JSON.parse(rawNew);

            // Migration V2 -> V3 (Lift holidays to global)
            if (!parsed.globalHolidays && parsed.timelines) {
                const firstWithHolidays = parsed.timelines.find(t => t.data && t.data.holidays && t.data.holidays.length > 0);
                parsed.globalHolidays = firstWithHolidays ? firstWithHolidays.data.holidays : [];
                parsed.timelines.forEach(t => {
                    if (t.data && t.data.holidays) delete t.data.holidays;
                });
            }

            // Object.assignで既存参照を維持（ESM対応）
            Object.assign(appState, {
                activeTimelineId: parsed.activeTimelineId,
                globalHolidays: parsed.globalHolidays || [],
                timelines: parsed.timelines
            });
            if (!appState.timelines || !Array.isArray(appState.timelines)) throw new Error("Invalid structure");
            if (!appState.globalHolidays) appState.globalHolidays = [];

        } catch (e) {
            console.error("Failed to parse app state, resetting.", e);
            resetToDefault();
        }
    } else if (rawOld) {
        // Migrate V1 -> V3
        try {
            const oldData = JSON.parse(rawOld);
            const newId = Date.now().toString();

            const holidays = oldData.holidays || [];
            if (oldData.holidays) delete oldData.holidays;

            // Object.assignで既存参照を維持（ESM対応）
            Object.assign(appState, {
                activeTimelineId: newId,
                globalHolidays: holidays,
                timelines: [{
                    id: newId,
                    name: 'Default Timeline',
                    data: oldData
                }]
            });
            validateTimelineData(appState.timelines[0].data);
            saveState();
        } catch (e) {
            console.error("Migration failed", e);
            resetToDefault();
        }
    } else {
        resetToDefault();
    }
}

/**
 * デフォルト状態にリセット
 */
export function resetToDefault() {
    const id = Date.now().toString();
    appState = {
        activeTimelineId: id,
        globalHolidays: [],
        timelines: [{
            id: id,
            name: 'Sprint 1',
            data: createDefaultTimelineData()
        }]
    };
    saveState();
}

/**
 * タイムラインデータを検証・補完
 */
export function validateTimelineData(data) {
    if (!data.phases) data.phases = JSON.parse(JSON.stringify(defaultPhaseConfig));
    if (!data.anchorType) data.anchorType = 'end';
    if (!data.sortOrder) data.sortOrder = 'asc';
}

/**
 * アクティブなタイムラインを取得
 */
export function getActiveTimeline() {
    const t = appState.timelines.find(t => t.id === appState.activeTimelineId);
    return t ? t : appState.timelines[0];
}

/**
 * アクティブなタイムラインのデータを取得
 */
export function getActiveData() {
    return getActiveTimeline().data;
}

/**
 * appStateを直接更新（外部からの変更用）
 */
export function updateAppState(newState) {
    appState = newState;
}

/**
 * 履歴から状態を復元（Undo/Redo用）
 * @param {Object} restoredState - 復元する状態
 */
export function restoreState(restoredState) {
    appState.activeTimelineId = restoredState.activeTimelineId;
    appState.globalHolidays = restoredState.globalHolidays || [];
    appState.timelines = restoredState.timelines || [];

    // LocalStorageにも保存
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
}
