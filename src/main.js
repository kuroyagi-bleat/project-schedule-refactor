// main.js - 初期化とイベント登録
// Phase 1: コード基盤整備
// Phase 3: Undo/Redo + キーボードショートカット

import { CONFIG, createDefaultTimelineData } from './config.js';
import { appState, loadState, saveState, getActiveData, getActiveTimeline, restoreState } from './state.js';
import {
    bindDOMElements,
    getDOMElements,
    renderPhases,
    renderSchedule,
    renderTimelineSelect,
    updateTopControls,
    replaceWithClone
} from './ui.js';
import { renderGantt, setScheduleUpdateCallback } from './gantt.js';
import { calculateSchedule } from './scheduler.js';
import { pushHistory, undo, redo, canUndo, canRedo, getHistoryState } from './history.js';

// circular dependency を解決するためのコールバック設定
setScheduleUpdateCallback(renderSchedule);

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
        addTimelineBtn.onclick = () => {
            const name = prompt("新しいタイムラインの名前を入力:", `Sprint ${appState.timelines.length + 1}`);
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
        renameTimelineBtn.onclick = () => {
            const active = getActiveTimeline();
            const newName = prompt("タイムラインの名前を変更:", active.name);
            if (newName) {
                active.name = newName;
                saveState();
                renderTimelineSelect();
            }
        };
    }

    if (deleteTimelineBtn) {
        deleteTimelineBtn.onclick = () => {
            if (appState.timelines.length <= 1) {
                alert("最後のタイムラインは削除できません。");
                return;
            }
            if (!confirm(`"${getActiveTimeline().name}" を削除しますか？`)) return;

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

    // イベント委譲でフェーズ操作を処理
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
            }
        } else if (e.target.classList.contains('anchor-start-radio') || e.target.classList.contains('anchor-end-radio')) {
            // アンカーラジオボタンの変更処理
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

    // 削除ボタン
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
        }
    });

    // ドラッグ&ドロップ並び替え
    let draggedIdx = null;

    phaseListEl.addEventListener('dragstart', (e) => {
        if (!e.target.classList.contains('draggable-item')) return;
        draggedIdx = parseInt(e.target.dataset.idx);
        e.target.style.opacity = '0.5';
    });

    phaseListEl.addEventListener('dragend', (e) => {
        if (!e.target.classList.contains('draggable-item')) return;
        e.target.style.opacity = '1';
        draggedIdx = null;
    });

    phaseListEl.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    phaseListEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.draggable-item');
        if (!target || draggedIdx === null) return;

        const dropIdx = parseInt(target.dataset.idx);
        if (draggedIdx === dropIdx) return;

        const data = getActiveData();
        const [moved] = data.phases.splice(draggedIdx, 1);
        data.phases.splice(dropIdx, 0, moved);
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
                text += `${fmt(item.startDate)} ~ ${fmt(item.endDate)}${SEPARATOR}${item.name}${SEPARATOR}${item.days}日\n`;
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
                link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
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
    a.download = `schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
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
            if (data.timelines) {
                Object.assign(appState, data);
                if (!appState.globalHolidays) appState.globalHolidays = [];
                saveState();
                initUI();
            } else if (data.phases) {
                if (confirm("古い形式のデータです。新しいタイムラインとしてインポートしますか？")) {
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

