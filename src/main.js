
// main.js - 初期化とイベント登録
// Phase 1: コード基盤整備
// Phase 3: Undo/Redo + キーボードショートカット

import { CONFIG, createDefaultTimelineData, PRESETS } from './config.js';
import {
    appState, saveState, loadState, getActiveTimeline, getActiveData,
    addTag, updateTag, deleteTag, togglePhaseTag,
    selectPhase, deselectPhase, clearSelection, togglePhaseSelection, getSelectedPhaseIds, setSelection, selectedPhaseIds,
    saveCurrentAsPreset, applyPreset, deletePreset, restoreState, validateTimelineData, // [NEW] validateTimelineData added
    appSettings, saveSettings // [NEW] for holiday import
} from './state.js';
import {
    bindDOMElements,
    getDOMElements,
    renderPhases,
    renderSchedule,
    renderTimelineSelect,
    updateTopControls,
    replaceWithClone,
    renderTagManager, // [NEW]
    renderTagFilter,  // [NEW]
    openTagSelectionModal, // [NEW]
    renderPresetManager // [NEW]
} from './ui.js';

import { renderGantt, setScheduleUpdateCallback } from './gantt.js';
import { calculateSchedule } from './scheduler.js';
import { normalizeDateStr } from './dateUtils.js';
import { pushHistory, undo, redo, canUndo, canRedo, getHistoryState } from './history.js';

// circular dependency を解決するためのコールバック設定
setScheduleUpdateCallback(renderSchedule);

// ===================================
// カスタムモーダルダイアログ（ネイティブprompt/confirmの代替）
// ===================================

/**
 * カスタムプロンプトダイアログを表示
 * @param {string} title - ダイアログタイトル
 * @param {string} defaultValue - デフォルト値
 * @returns {Promise<string|null>} - 入力値またはnull（キャンセル時）
 */
function showPrompt(title, defaultValue = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const inputEl = document.getElementById('modal-input');
        const okBtn = document.getElementById('modal-ok-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        // 初期化
        titleEl.textContent = title;
        inputEl.value = defaultValue;
        modal.style.display = 'flex';

        // フォーカスを入力欄に
        setTimeout(() => inputEl.focus(), 50);

        // クリーンアップ関数
        const cleanup = () => {
            modal.style.display = 'none';
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            inputEl.onkeydown = null;
        };

        // OKボタン
        okBtn.onclick = () => {
            const value = inputEl.value.trim();
            cleanup();
            resolve(value || null);
        };

        // キャンセルボタン
        cancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };

        // Enterキーで確定、Escapeでキャンセル
        inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                okBtn.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelBtn.click();
            }
        };

        // オーバーレイクリックでキャンセル
        modal.onclick = (e) => {
            if (e.target === modal) {
                cancelBtn.click();
            }
        };
    });
}

/**
 * カスタム確認ダイアログを表示
 * @param {string} message - 確認メッセージ
 * @returns {Promise<boolean>} - true（OK）またはfalse（キャンセル）
 */
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        // 初期化
        messageEl.textContent = message;
        modal.style.display = 'flex';

        // フォーカスをキャンセルボタンに（安全側）
        setTimeout(() => cancelBtn.focus(), 50);

        // キーボード操作
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                cancelBtn.click();
            }
        };
        document.addEventListener('keydown', escHandler);

        document.addEventListener('keydown', escHandler);

        // [FIX] ボタンイベントの復元
        okBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(false);
            }
        };

        // クリーンアップ関数（リスナー削除を確実に行う）
        const cleanup = () => {
            document.removeEventListener('keydown', escHandler);
            modal.style.display = 'none';
            okBtn.onclick = null;
            cancelBtn.onclick = null;
        };
    });
}

/**
 * カスタムアラートダイアログを表示（OKボタンのみ）
 * @param {string} message - 表示メッセージ
 * @returns {Promise<void>}
 */
function showAlert(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        // 初期化（キャンセルボタンを非表示）
        messageEl.textContent = message;
        cancelBtn.style.display = 'none';
        modal.style.display = 'flex';

        // フォーカスをOKボタンに
        setTimeout(() => okBtn.focus(), 50);

        // Enterキーで閉じる
        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                okBtn.click();
            }
        };
        document.addEventListener('keydown', keyHandler);

        document.addEventListener('keydown', keyHandler);

        // [FIX] ボタンイベントの復元
        okBtn.onclick = () => {
            cleanup();
            resolve();
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve();
            }
        };

        // クリーンアップ関数
        const cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            modal.style.display = 'none';
            cancelBtn.style.display = '';  // 元に戻す
            okBtn.onclick = null;
        };
    });
}

/**
 * 全UIを再描画
 */
function renderAll() {
    renderTimelineSelect();
    renderPhases();
    renderSchedule();
    renderGantt();
    updateTopControls();
    updateUndoRedoButtons();
    renderTagManager(); // [NEW]
    renderTagFilter(); // [NEW]
    renderPresetManager(); // [NEW]
}

/**
 * スケジュールを更新（再描画）
 */
function updateSchedule() {
    renderSchedule();
    renderGantt();
}

/**
 * 状態変更時に履歴を保存
 */
function saveWithHistory() {
    saveState();
    pushHistory(appState);
    updateUndoRedoButtons();
}

/**
 * Undo/Redoボタンの有効/無効を更新
 */
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
        undoBtn.disabled = !canUndo();
        undoBtn.style.opacity = canUndo() ? '1' : '0.4';
    }
    if (redoBtn) {
        redoBtn.disabled = !canRedo();
        redoBtn.style.opacity = canRedo() ? '1' : '0.4';
    }
}

/**
 * Undoを実行
 */
function performUndo() {
    const previousState = undo();
    if (previousState) {
        restoreState(previousState);
        renderAll();
    }
}

/**
 * Redoを実行
 */
function performRedo() {
    const nextState = redo();
    if (nextState) {
        restoreState(nextState);
        renderAll();
    }
}

/**
 * タイムライン関連のイベントリスナーを設定
 */
function attachTimelineListeners() {
    const { timelineSelect, addTimelineBtn, renameTimelineBtn, deleteTimelineBtn } = getDOMElements();

    if (timelineSelect) {
        timelineSelect.onchange = (e) => {
            appState.activeTimelineId = e.target.value;
            saveState();
            initUI();
        };
    }

    if (addTimelineBtn) {
        addTimelineBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const defaultName = `Sprint ${appState.timelines.length + 1} `;
            const name = await showPrompt("新しいスプリントの名前を入力", defaultName);

            if (!name) return;

            const newId = Date.now().toString();
            appState.timelines.push({
                id: newId,
                name: name,
                data: createDefaultTimelineData()
            });
            appState.activeTimelineId = newId;
            saveState();
            renderTimelineSelect();
            initUI();
        };
    }

    if (renameTimelineBtn) {
        renameTimelineBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const active = getActiveTimeline();
            const newName = await showPrompt("スプリント名を変更", active.name);
            if (newName) {
                active.name = newName;
                saveState();
                renderTimelineSelect();
            }
        };
    }

    if (deleteTimelineBtn) {
        deleteTimelineBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (appState.timelines.length <= 1) {
                await showAlert("最後のスプリントは削除できません。");
                return;
            }
            const confirmed = await showConfirm(`"${getActiveTimeline().name}" を削除しますか？`);
            if (!confirmed) return;

            appState.timelines = appState.timelines.filter(t => t.id !== appState.activeTimelineId);
            appState.activeTimelineId = appState.timelines[0].id;
            saveState();
            initUI();
        };
    }
}

/**
 * フェーズリストのイベントリスナーを設定
 */
function attachPhaseListeners() {
    const { phaseListEl } = getDOMElements();
    if (!phaseListEl) return;

    // ---------------------------------------------------------
    // 1. 入力値の変更 (Change / Input)
    // ---------------------------------------------------------
    phaseListEl.addEventListener('change', (e) => {
        const data = getActiveData();
        const idx = parseInt(e.target.dataset.idx);

        if (e.target.classList.contains('phase-name-input')) {
            data.phases[idx].name = e.target.value;
            saveState();
            renderSchedule();
        } else if (e.target.classList.contains('phase-days-input')) {
            const val = parseInt(e.target.value) || 1;
            data.phases[idx].days = Math.max(1, val);
            saveState();
            updateSchedule();
            renderPhases();
        } else if (e.target.classList.contains('phase-parallel-chk')) {
            const phase = data.phases[idx];
            phase.isParallel = e.target.checked;
            if (!phase.isParallel) {
                delete phase.manualStartDate;
                delete phase.manualEndDate;
            }
            saveState();
            renderPhases();
            updateSchedule();
        } else if (e.target.classList.contains('phase-start-input') || e.target.classList.contains('phase-end-input')) {
            const phase = data.phases[idx];
            if (phase.isParallel) {
                if (e.target.classList.contains('phase-start-input')) {
                    phase.manualStartDate = e.target.value;
                } else {
                    phase.manualEndDate = e.target.value;
                }
                saveState();
                updateSchedule();
                renderPhases();
            } else {
                const isAnchorStart = data.anchorPhaseId === phase.id && data.anchorType === 'start';
                const isAnchorEnd = data.anchorPhaseId === phase.id && data.anchorType === 'end';
                if ((isAnchorStart && e.target.classList.contains('phase-start-input')) ||
                    (isAnchorEnd && e.target.classList.contains('phase-end-input'))) {
                    data.anchorDate = e.target.value;
                    saveState();
                    updateSchedule();
                    renderPhases();
                }
            }
        } else if (e.target.classList.contains('anchor-start-radio') || e.target.classList.contains('anchor-end-radio')) {
            const phaseId = e.target.dataset.phaseId;
            const anchorType = e.target.dataset.anchorType;
            data.anchorPhaseId = phaseId;
            data.anchorType = anchorType;
            saveState();
            renderPhases();
            updateSchedule();
            updateTopControls();
        }
    });

    phaseListEl.addEventListener('input', (e) => {
        const data = getActiveData();
        const idx = parseInt(e.target.dataset.idx);

        if (e.target.classList.contains('phase-days-input')) {
            const val = parseInt(e.target.value) || 1;
            data.phases[idx].days = Math.max(1, val);
            const schedule = calculateSchedule(data);
            if (schedule) {
                const startInputs = phaseListEl.querySelectorAll('.phase-start-input');
                const endInputs = phaseListEl.querySelectorAll('.phase-end-input');
                schedule.forEach((s, i) => {
                    const phase = data.phases[i];
                    if (!phase || phase.isParallel) return;
                    if (startInputs[i]) startInputs[i].value = normalizeDateStr(s.startDate);
                    if (endInputs[i]) endInputs[i].value = normalizeDateStr(s.endDate);
                });
            }
            updateSchedule();
        } else if (e.target.classList.contains('phase-name-input')) {
            data.phases[idx].name = e.target.value;
            renderGantt();
        }
    });

    // ---------------------------------------------------------
    // 2. クリック処理 (削除 / タグ / 選択)
    // ---------------------------------------------------------
    let lastSelectedPhaseIdx = null;

    phaseListEl.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const idx = parseInt(e.target.closest('.delete-btn').dataset.idx);
            const data = getActiveData();
            if (data.phases.length <= 1) {
                alert("最後のフェーズは削除できません。");
                return;
            }
            const phase = data.phases[idx];
            if (phase.id === data.anchorPhaseId) {
                alert("アンカーは削除できません。先に別のフェーズをアンカーにしてください。");
                return;
            }
            data.phases.splice(idx, 1);
            saveWithHistory();
            renderPhases();
            updateSchedule();
            return;
        }

        if (e.target.closest('.tag-btn')) {
            const idx = parseInt(e.target.closest('.tag-btn').dataset.idx);
            openTagSelectionModal(idx);
            return;
        }

        const row = e.target.closest('.phase-row');
        if (!row) return;

        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'BUTTON' ||
            e.target.closest('label')) {
            return;
        }

        const idx = parseInt(row.dataset.idx);
        const data = getActiveData();
        const phase = data.phases[idx];
        const id = phase.id;

        if (e.shiftKey && lastSelectedPhaseIdx !== null) {
            const start = Math.min(lastSelectedPhaseIdx, idx);
            const end = Math.max(lastSelectedPhaseIdx, idx);

            if (!e.metaKey && !e.ctrlKey) {
                clearSelection();
            }

            for (let i = start; i <= end; i++) {
                const p = data.phases[i];
                selectPhase(p.id);
            }
        } else if (e.metaKey || e.ctrlKey) {
            togglePhaseSelection(id);
            lastSelectedPhaseIdx = idx;
        } else {
            clearSelection();
            selectPhase(id);
            lastSelectedPhaseIdx = idx;
        }
        renderPhases();
    });

    // ---------------------------------------------------------
    // 3. ドラッグ&ドロップ (Multi-DnD)
    // ---------------------------------------------------------
    let draggedIndices = [];

    phaseListEl.addEventListener('dragstart', (e) => {
        const row = e.target.closest('.draggable-item');
        if (!row) return;

        const idx = parseInt(row.dataset.idx);
        const data = getActiveData();
        const phase = data.phases[idx];

        if (!selectedPhaseIds.has(phase.id)) {
            clearSelection();
            selectPhase(phase.id);
            lastSelectedPhaseIdx = idx;
            renderPhases();
        }

        draggedIndices = [];
        data.phases.forEach((p, i) => {
            if (selectedPhaseIds.has(p.id)) {
                draggedIndices.push(i);
            }
        });
        if (!draggedIndices.includes(idx)) draggedIndices.push(idx);
        draggedIndices.sort((a, b) => a - b);

        e.dataTransfer.effectAllowed = 'move';
        row.style.opacity = '0.5';
    });

    phaseListEl.addEventListener('dragend', (e) => {
        if (!e.target.classList.contains('draggable-item')) return;
        e.target.style.opacity = '1';
        draggedIndices = [];
    });

    phaseListEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    phaseListEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.draggable-item');
        if (!target || draggedIndices.length === 0) return;

        const dropTargetIdx = parseInt(target.dataset.idx);
        if (draggedIndices.includes(dropTargetIdx)) return;

        const data = getActiveData();
        const movingItems = [];

        for (let i = draggedIndices.length - 1; i >= 0; i--) {
            const indexToRemove = draggedIndices[i];
            movingItems.unshift(data.phases[indexToRemove]);
            data.phases.splice(indexToRemove, 1);
        }

        let adjust = 0;
        draggedIndices.forEach(removedIdx => {
            if (removedIdx < dropTargetIdx) {
                adjust++;
            }
        });
        const finalDropIdx = dropTargetIdx - adjust;

        data.phases.splice(finalDropIdx, 0, ...movingItems);

        saveState();
        renderPhases();
        updateSchedule();
    });
}

/**
 * トップレベルのイベントリスナーを設定
 */
function attachTopListeners() {
    const elements = getDOMElements();

    // アンカーフェーズ選択
    if (elements.anchorPhaseSelect) {
        elements.anchorPhaseSelect.addEventListener('change', (e) => {
            const data = getActiveData();
            data.anchorPhaseId = e.target.value;
            saveState();
            renderPhases();
            updateSchedule();
        });
    }

    // アンカータイプ
    if (elements.anchorTypeRadios) {
        elements.anchorTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const data = getActiveData();
                data.anchorType = e.target.value;
                saveState();
                renderPhases();
                updateSchedule();
            });
        });
    }

    // フェーズ追加
    const addPhaseBtn = document.getElementById('add-phase-btn');
    if (addPhaseBtn) {
        addPhaseBtn.addEventListener('click', () => {
            const data = getActiveData();
            data.phases.push({ id: Date.now().toString(), name: 'New Phase', days: 5 });
            saveWithHistory();
            renderPhases();
            updateSchedule();
        });
    }

    // アンカー日付
    if (elements.anchorDateInput) {
        elements.anchorDateInput.addEventListener('change', (e) => {
            const data = getActiveData();
            data.anchorDate = e.target.value;
            saveState();
            updateSchedule();
        });
    }

    // 祝日入力
    if (elements.holidaysInput) {
        elements.holidaysInput.addEventListener('change', (e) => {
            const text = e.target.value;
            appState.globalHolidays = text.split('\n').map(l => l.trim()).filter(l => l.match(/^\d{4}-\d{2}-\d{2}$/));
            saveState();
            updateSchedule();
        });
    }

    // ソートボタン
    const sortBtn = document.getElementById('sort-toggle-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            const data = getActiveData();
            data.sortOrder = data.sortOrder === 'asc' ? 'desc' : 'asc';
            saveState();
            updateSchedule();
        });
    }

    // テキストコピー
    const copyBtn = document.getElementById('copy-text-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const schedule = calculateSchedule();
            if (!schedule) return;
            const data = getActiveData();
            let list = [...schedule];
            if (data.sortOrder === 'asc') list.reverse();

            const SEPARATOR = " / ";
            let text = "";
            const fmt = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const d_str = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${d_str}`;
            };
            list.forEach(item => {
                text += `${fmt(item.startDate)} ~${fmt(item.endDate)}${SEPARATOR}${item.name}${SEPARATOR}${item.days} 日\n`;
            });
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.textContent = "✅ Copied!";
                setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
            }).catch(err => { alert('コピーに失敗しました'); });
        });
    }

    // 設定パネルトグル
    const settingsBtn = document.getElementById('settings-toggle-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const panel = document.getElementById('global-settings-panel');
            if (panel) {
                const isHidden = panel.style.display === 'none';
                panel.style.display = isHidden ? 'block' : 'none';
                settingsBtn.setAttribute('aria-expanded', !isHidden);
                // アイコンの切り替え（オプション）
                settingsBtn.classList.toggle('active', !isHidden);
            }
        });
    }

    // Save/Load
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', exportJson);
    }

    const loadBtn = document.getElementById('load-btn');
    const fileInput = document.getElementById('file-input');
    if (loadBtn && fileInput) {
        loadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) importJson(e.target.files[0]);
        });
    }

    // [NEW] Tag Management
    // Add Tag Button
    const addTagBtn = document.getElementById('add-tag-btn');
    if (addTagBtn) {
        addTagBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('new-tag-name');
            const colorInput = document.getElementById('new-tag-color');
            if (nameInput && nameInput.value.trim()) {
                addTag(nameInput.value.trim(), colorInput.value);
                nameInput.value = '';
                renderTagManager();
                renderTagFilter();
            }
        });
    }

    // Filter Change
    const tagFilterSelect = document.getElementById('tag-filter-select');
    if (tagFilterSelect) {
        tagFilterSelect.addEventListener('change', (e) => {
            renderPhases();
            renderSchedule();
            renderGantt();
        });
    }

    // [NEW] Preset Management
    const savePresetBtn = document.getElementById('save-preset-btn');
    if (savePresetBtn) {
        savePresetBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('new-preset-name');
            const name = nameInput.value.trim();
            if (!name) {
                alert('プリセット名を入力してください');
                return;
            }
            saveCurrentAsPreset(name);
            nameInput.value = '';
            renderPresetManager();
            alert(`プリセット "${name}" を保存しました`);
        });
    }

    const presetList = document.getElementById('preset-list');
    if (presetList) {
        presetList.addEventListener('click', (e) => {
            if (e.target.classList.contains('apply-default-preset-btn')) {
                const name = e.target.dataset.presetName;
                const preset = PRESETS.find(p => p.name === name);
                if (preset && confirm(`プリセット "${name}" を適用しますか？\n現在のスケジュールは上書きされます。`)) {
                    const activeData = getActiveData();
                    activeData.phases = JSON.parse(JSON.stringify(preset.phases));
                    activeData.phases.forEach(p => {
                        p.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                    });
                    saveState();
                    pushHistory(appState);
                    renderPhases();
                    updateSchedule();
                    alert(`プリセット "${name}" を適用しました`);
                }
            } else if (e.target.classList.contains('apply-user-preset-btn')) {
                const idx = parseInt(e.target.dataset.index);
                if (confirm('このプリセットを適用しますか？\n現在のスケジュールは上書きされます。')) {
                    applyPreset(idx);
                    pushHistory(appState);
                    renderPhases();
                    updateSchedule();
                    alert('プリセットを適用しました');
                }
            } else if (e.target.classList.contains('delete-preset-btn')) {
                const idx = parseInt(e.target.dataset.index);
                if (confirm('このプリセットを削除しますか？')) {
                    deletePreset(idx);
                    renderPresetManager();
                }
            }
        });
    }

    // [NEW] Settings Export/Import
    const exportSettingsBtn = document.getElementById('export-settings-btn');
    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', () => {
            const settings = localStorage.getItem('project-scheduler-settings');
            if (!settings) {
                alert('設定データがありません');
                return;
            }
            const blob = new Blob([settings], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scheduler-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });
    }

    const importSettingsBtn = document.getElementById('import-settings-btn');
    const settingsFileInput = document.getElementById('settings-file-input');
    if (importSettingsBtn && settingsFileInput) {
        importSettingsBtn.addEventListener('click', () => settingsFileInput.click());
        settingsFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.globalHolidays || data.presets) {
                        localStorage.setItem('project-scheduler-settings', JSON.stringify(data));
                        loadState();
                        renderAll();
                        alert('設定をインポートしました');
                    } else {
                        alert('無効な設定ファイルです');
                    }
                } catch (err) {
                    console.error(err);
                    alert('インポートに失敗しました');
                }
            };
            reader.readAsText(file);
        });
    }
}


// 画像エクスポート
const exportBtn = document.getElementById('export-image-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
        const btn = e.target;
        const container = document.getElementById('gantt-container');
        if (!container || !container.firstChild) return;

        const originalText = "📷 Save Image";
        btn.innerText = '⏳ Capturing...';

        if (typeof html2canvas === 'undefined') {
            alert('ライブラリが読み込まれていません。');
            btn.innerText = originalText;
            return;
        }

        html2canvas(container.firstChild, {
            backgroundColor: '#1e293b',
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `gantt - chart - ${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();

            btn.innerText = '✅ Saved!';
            setTimeout(() => btn.innerText = originalText, 2000);
        }).catch(err => {
            console.error(err);
            alert('エクスポートに失敗しました。');
            btn.innerText = originalText;
        });
    });
}

/**
 * JSONエクスポート
 */
function exportJson() {
    const data = JSON.stringify(appState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule - backup - ${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

/**
 * JSONインポート
 */
function importJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // [NEW] 祝日データの抽出と統合（旧形式 holidays / 新形式 globalHolidays）
            const importedHolidays = data.globalHolidays || data.holidays;
            if (importedHolidays && Array.isArray(importedHolidays) && importedHolidays.length > 0) {
                if (confirm(`ファイル内に祝日データ(${importedHolidays.length}件)が見つかりました。\n現在の祝日設定に追加しますか？`)) {
                    // 現在の祝日設定と統合（重複排除）
                    const currentHolidays = appSettings.globalHolidays || [];
                    const mergedHolidays = [...new Set([...currentHolidays, ...importedHolidays])].sort();
                    appSettings.globalHolidays = mergedHolidays;
                    saveSettings(); // 即保存
                    alert('祝日設定を更新しました。設定パネルで確認できます。');
                }
            }

            if (data.timelines) {
                Object.assign(appState, data);
                if (!appState.globalHolidays) appState.globalHolidays = [];
                saveState();
                initUI();
            } else if (data.phases) {
                if (confirm("古い形式のデータです。新しいタイムラインとしてインポートしますか？")) {
                    // データの正規化（不足プロパティの補完）
                    validateTimelineData(data);

                    const newId = Date.now().toString();
                    appState.timelines.push({
                        id: newId,
                        name: "Imported Timeline",
                        data: data
                    });
                    appState.activeTimelineId = newId;
                    saveState();
                    initUI();
                }
            } else {
                alert('無効なJSONフォーマットです。');
            }
        } catch (err) {
            alert('JSONの解析に失敗しました。');
        }
    };
    reader.readAsText(file);
}

/**
 * UIを初期化
 */
// リスナー登録済みフラグ（イベントリスナーの重複登録を防ぐ）
let listenersAttached = false;

function initUI() {
    loadState();
    bindDOMElements();

    // 初期状態を履歴に保存（初回のみ）
    if (!listenersAttached) {
        pushHistory(appState);
    }

    renderTimelineSelect();
    renderPhases();
    updateSchedule();
    updateTopControls();
    updateUndoRedoButtons();
    renderTagManager(); // [FIX] Added missing render
    renderTagFilter();  // [FIX] Added missing render
    renderPresetManager(); // [FIX] Added missing render

    // イベントリスナーは初回のみ登録
    if (!listenersAttached) {
        attachTimelineListeners();
        attachPhaseListeners();
        attachTopListeners();
        attachKeyboardShortcuts();
        attachUndoRedoListeners();
        listenersAttached = true;
    }
}

/**
 * キーボードショートカットを設定
 */
function attachKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

        if (!ctrlOrCmd) return;

        // Ctrl/Cmd + Z: Undo
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            performUndo();
        }
        // Ctrl/Cmd + Shift + Z: Redo
        else if (e.key === 'z' && e.shiftKey) {
            e.preventDefault();
            performRedo();
        }
        // Ctrl/Cmd + Y: Redo (Windows style)
        else if (e.key === 'y') {
            e.preventDefault();
            performRedo();
        }
        // Ctrl/Cmd + S: Save
        else if (e.key === 's') {
            e.preventDefault();
            saveToFile();
        }
        // Ctrl/Cmd + N: New Phase
        else if (e.key === 'n') {
            e.preventDefault();
            addNewPhase();
        }
    });
}

/**
 * 新規フェーズを追加
 */
function addNewPhase() {
    const data = getActiveData();
    const newPhase = {
        id: Date.now().toString(),
        name: "New Phase",
        days: 5
    };
    data.phases.push(newPhase);
    saveWithHistory();
    renderPhases();
    updateSchedule();
}

/**
 * Undo/Redoボタンのイベントリスナー
 */
function attachUndoRedoListeners() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
        undoBtn.addEventListener('click', performUndo);
    }
    if (redoBtn) {
        redoBtn.addEventListener('click', performRedo);
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    initUI();
});
