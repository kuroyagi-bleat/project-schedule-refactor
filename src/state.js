// state.js - 状態管理とLocalStorage
// Phase 1: コード基盤整備
// Phase 13: プリセット機能・設定分離

import { CONFIG, createDefaultTimelineData, defaultPhaseConfig } from './config.js';

// 設定保存用キー
const SETTINGS_KEY = 'project-scheduler-settings';

/**
 * 環境設定（プロジェクトデータから分離）
 * {
 *   globalHolidays: [],
 *   presets: [{ name: "Preset A", phases: [...] }]
 * }
 */
export let appSettings = {
    globalHolidays: [],
    presets: []
};

/**
 * アプリケーション状態
 * V3 State Structure:
 * {
 *   activeTimelineId: "uuid",
 *   timelines: [{ id, name, data: { anchorDate, phases, ... } }]
 * }
 */
export let appState = {
    activeTimelineId: null,
    // globalHolidays: removed from direct property (use accessor)
    tags: [],
    timelines: []
};

// 互換性維持のためのアクセサ定義
// main.js, ui.js から appState.globalHolidays へのアクセスを appSettings に流す
Object.defineProperty(appState, 'globalHolidays', {
    get() { return appSettings.globalHolidays; },
    set(v) { appSettings.globalHolidays = v; },
    enumerable: false // JSON.stringify(appState) には含めない（分離するため）
});

/**
 * グローバル祝日を取得（dateUtils用）
 */
export function getGlobalHolidays() {
    return appSettings.globalHolidays || [];
}

/**
 * 設定をLocalStorageに保存
 */
export function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
}

/**
 * 状態をLocalStorageに保存
 */
export function saveState() {
    // appStateの保存（enumerable: false なので globalHolidays は含まれない）
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
    // 設定の保存
    saveSettings();
}

/**
 * LocalStorageから状態を読み込み
 */
export function loadState() {
    // 1. Load Settings
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
        try {
            const parsed = JSON.parse(rawSettings);
            appSettings.globalHolidays = parsed.globalHolidays || [];
            appSettings.presets = parsed.presets || [];
        } catch (e) { console.error("Failed to load settings", e); }
    }

    // 2. Load App State
    const rawNew = localStorage.getItem(CONFIG.STORAGE_KEY);
    const rawOld = localStorage.getItem(CONFIG.OLD_STORAGE_KEY);

    if (rawNew) {
        try {
            const parsed = JSON.parse(rawNew);

            // Migration V2 -> V3 (parsed.globalHolidays -> appSettings)
            // もし設定ファイルがなく、プロジェクトデータに祝日が含まれていたら移行する
            if (!rawSettings && parsed.globalHolidays && parsed.globalHolidays.length > 0) {
                appSettings.globalHolidays = parsed.globalHolidays;
                saveSettings(); // 即座に保存
            }
            // Compatibility for V2 where holidays were inside timelines
            if (!parsed.globalHolidays && parsed.timelines && (!rawSettings || appSettings.globalHolidays.length === 0)) {
                const firstWithHolidays = parsed.timelines.find(t => t.data && t.data.holidays && t.data.holidays.length > 0);
                if (firstWithHolidays) {
                    appSettings.globalHolidays = firstWithHolidays.data.holidays;
                    saveSettings();
                }
                // Clean up legacy data
                parsed.timelines.forEach(t => {
                    if (t.data && t.data.holidays) delete t.data.holidays;
                });
            }

            // Object.assignで既存参照を維持（ESM対応）
            Object.assign(appState, {
                activeTimelineId: parsed.activeTimelineId,
                tags: parsed.tags || [],
                timelines: parsed.timelines
            });
            if (!appState.timelines || !Array.isArray(appState.timelines)) throw new Error("Invalid structure");
            if (!appState.tags) appState.tags = [];

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

            // Migrate holidays to settings
            if (!rawSettings) {
                appSettings.globalHolidays = holidays;
                saveSettings();
            }

            // Object.assignで既存参照を維持
            Object.assign(appState, {
                activeTimelineId: newId,
                // globalHolidays: holidays, // No longer needed here
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
 * デフォルト状態にリセット（プロジェクトデータのみ）
 * 環境設定（祝日など）は保持する
 */
export function resetToDefault() {
    const id = Date.now().toString();

    // appState のみをリセット
    // オブジェクトの参照を変えずにプロパティを更新
    appState.activeTimelineId = id;
    appState.tags = [];
    appState.timelines = [{
        id: id,
        name: 'Sprint 1',
        data: createDefaultTimelineData()
    }];

    saveState();
}

/**
 * タイムラインデータを検証・補完
 */
export function validateTimelineData(data) {
    if (!data.phases) data.phases = JSON.parse(JSON.stringify(defaultPhaseConfig));
    if (!data.anchorType) data.anchorType = 'end';
    if (!data.sortOrder) data.sortOrder = 'asc';

    // Ensure tagIds exists on phases
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
    if (newState.globalHolidays) {
        appSettings.globalHolidays = newState.globalHolidays;
        delete newState.globalHolidays; // Don't put it in appState
        saveSettings();
    }
    Object.assign(appState, newState);
    saveState();
}

/**
 * 履歴から状態を復元（Undo/Redo用）
 * @param {Object} restoredState - 復元する状態
 */
export function restoreState(restoredState) {
    appState.activeTimelineId = restoredState.activeTimelineId;
    // Undo/Redo では祝日（環境設定）は戻さない仕様（プロジェクトデータではないため）

    appState.tags = restoredState.tags || [];
    appState.timelines = restoredState.timelines || [];

    saveState();
}

// ---------------------------------------------------------
// Tag Management
// ---------------------------------------------------------

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

export function updateTag(id, name, color) {
    const tag = appState.tags.find(t => t.id === id);
    if (tag) {
        tag.name = name;
        tag.color = color;
        saveState();
    }
}

export function deleteTag(id) {
    if (!appState.tags) return;
    appState.tags = appState.tags.filter(t => t.id !== id);
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

export function togglePhaseTag(timelineId, phaseId, tagId) {
    const timeline = appState.timelines.find(t => t.id === timelineId);
    if (!timeline) return false;

    const phase = timeline.data.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    if (!phase.tagIds) phase.tagIds = [];

    if (phase.tagIds.includes(tagId)) {
        phase.tagIds = phase.tagIds.filter(id => id !== tagId);
    } else {
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

// ---------------------------------------------------------
// Selection Management (Transient)
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// Preset Management [NEW]
// ---------------------------------------------------------

/**
 * 現在のフェーズリストをプリセットとして保存
 * @param {string} name 
 */
export function saveCurrentAsPreset(name) {
    const activeData = getActiveData();
    // フェーズデータのみを抽出（タグIDなども含む）
    const preset = {
        name: name,
        phases: JSON.parse(JSON.stringify(activeData.phases))
    };
    appSettings.presets.push(preset);
    saveSettings();
}

/**
 * プリセットを削除
 * @param {number} index 
 */
export function deletePreset(index) {
    if (index >= 0 && index < appSettings.presets.length) {
        appSettings.presets.splice(index, 1);
        saveSettings();
    }
}

/**
 * プリセットを適用（現在のタイムラインを上書き）
 * @param {number} index 
 */
export function applyPreset(index) {
    const preset = appSettings.presets[index];
    if (!preset) return;

    const activeData = getActiveData();
    activeData.phases = JSON.parse(JSON.stringify(preset.phases));

    // IDを再生成してユニークにする
    activeData.phases.forEach(p => {
        p.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    });

    saveState();
}
