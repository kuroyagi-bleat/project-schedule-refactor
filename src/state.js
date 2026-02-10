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
    tags: [], // [NEW] { id, name, color }
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
                tags: parsed.tags || [], // [NEW]
                timelines: parsed.timelines
            });
            if (!appState.timelines || !Array.isArray(appState.timelines)) throw new Error("Invalid structure");
            if (!appState.globalHolidays) appState.globalHolidays = [];
            if (!appState.tags) appState.tags = []; // [NEW]

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
        tags: [],
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

    // [NEW] Ensure tagIds exists on phases
    data.phases.forEach(p => {
        if (!p.tagIds) p.tagIds = [];
    });
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
    appState.tags = restoredState.tags || [];
    appState.timelines = restoredState.timelines || [];

    // LocalStorageにも保存
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
}

/**
 * 新しいタグを作成
 * @param {string} name
 * @param {string} color
 * @returns {Object} 作成されたタグ
 */
export function addTag(name, color) {
    const newTag = {
        id: 'tag-' + Date.now(),
        name,
        color
    };
    appState.tags.push(newTag);
    saveState();
    return newTag;
}

/**
 * タグを更新
 * @param {string} id
 * @param {string} name
 * @param {string} color
 */
export function updateTag(id, name, color) {
    const tag = appState.tags.find(t => t.id === id);
    if (tag) {
        tag.name = name;
        tag.color = color;
        saveState();
    }
}

/**
 * タグを削除（使用されているフェーズからも削除）
 * @param {string} id
 */
export function deleteTag(id) {
    if (!appState.tags) return;

    // グローバル設定から削除
    appState.tags = appState.tags.filter(t => t.id !== id);

    // 全タイムラインの全フェーズから参照を削除 (activeTimelineだけでなく全て)
    if (appState.timelines) {
        appState.timelines.forEach(timeline => {
            if (timeline.data && timeline.data.phases) {
                timeline.data.phases.forEach(phase => {
                    if (phase.tagIds) {
                        phase.tagIds = phase.tagIds.filter(tagId => tagId !== id);
                    }
                });
            }
        });
    }
    saveState();
}

/**
 * フェーズのタグ付与状態をトグル
 * @param {string} timelineId
 * @param {string} phaseId
 * @param {string} tagId
 * @returns {boolean} 成功したかどうか
 */
export function togglePhaseTag(timelineId, phaseId, tagId) {
    const timeline = appState.timelines.find(t => t.id === timelineId);
    if (!timeline) return false;

    const phase = timeline.data.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    if (!phase.tagIds) phase.tagIds = [];

    if (phase.tagIds.includes(tagId)) {
        // 削除
        phase.tagIds = phase.tagIds.filter(id => id !== tagId);
    } else {
        // 追加（最大3つチェック）
        if (phase.tagIds.length < 3) {
            phase.tagIds.push(tagId);
        } else {
            console.warn("Max 3 tags allowed");
            return false;
        }
    }
    saveState();
    return true;
}

/**
 * 選択中のフェーズID管理（永続化しない）
 */
export const selectedPhaseIds = new Set();

export function getSelectedPhaseIds() {
    return Array.from(selectedPhaseIds);
}

export function selectPhase(id) {
    selectedPhaseIds.add(id);
}

export function deselectPhase(id) {
    selectedPhaseIds.delete(id);
}

export function clearSelection() {
    selectedPhaseIds.clear();
}

export function togglePhaseSelection(id) {
    if (selectedPhaseIds.has(id)) {
        selectedPhaseIds.delete(id);
    } else {
        selectedPhaseIds.add(id);
    }
}

export function setSelection(ids) {
    selectedPhaseIds.clear();
    ids.forEach(id => selectedPhaseIds.add(id));
}
