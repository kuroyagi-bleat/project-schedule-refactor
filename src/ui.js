// ui.js - DOM操作とレンダリング
// Phase 1: コード基盤整備



import { appState, appSettings, getActiveData, getActiveTimeline, saveState, addTag, deleteTag, updateTag, togglePhaseTag, selectedPhaseIds, deletePreset, applyPreset, saveCurrentAsPreset } from './state.js';
import { calculateSchedule, getDaysDiff } from './scheduler.js';
import { normalizeDateStr } from './dateUtils.js';
import { PRESETS } from './config.js';

// DOM要素の参照
let phaseListEl, resultContainerEl, anchorDateInput, holidaysInput, anchorPhaseSelect, anchorTypeRadios;
let timelineSelect, addTimelineBtn, renameTimelineBtn, deleteTimelineBtn;

/**
 * HTMLエスケープ（XSS対策）
 * @param {string} str - エスケープする文字列
 * @returns {string}
 */
export function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * DOM要素への参照をバインド
 */
export function bindDOMElements() {
    phaseListEl = document.getElementById('phase-list');
    resultContainerEl = document.getElementById('result-container');
    anchorDateInput = document.getElementById('anchor-date-input');
    holidaysInput = document.getElementById('holidays-input');
    anchorPhaseSelect = document.getElementById('anchor-phase-select');
    anchorTypeRadios = document.querySelectorAll('input[name="top-anchor-type"]');

    timelineSelect = document.getElementById('timeline-select');
    addTimelineBtn = document.getElementById('add-timeline-btn');
    renameTimelineBtn = document.getElementById('rename-timeline-btn');
    deleteTimelineBtn = document.getElementById('delete-timeline-btn');
}

/**
 * DOM要素参照のゲッター
 */
export function getDOMElements() {
    return {
        phaseListEl,
        resultContainerEl,
        anchorDateInput,
        holidaysInput,
        anchorPhaseSelect,
        anchorTypeRadios,
        timelineSelect,
        addTimelineBtn,
        renameTimelineBtn,
        deleteTimelineBtn
    };
}

/**
 * タイムライン選択を描画
 */
export function renderTimelineSelect() {
    if (!timelineSelect) return;
    timelineSelect.innerHTML = '';
    appState.timelines.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = escapeHtml(t.name);
        if (t.id === appState.activeTimelineId) opt.selected = true;
        timelineSelect.appendChild(opt);
    });
}

/**
 * フェーズリストを描画
 */
export function renderPhases() {
    if (!phaseListEl) return;
    phaseListEl.innerHTML = '';

    const data = getActiveData();
    renderAnchorSelect();

    const schedule = calculateSchedule(data);
    const dateMap = {};
    if (schedule) {
        schedule.forEach((s, i) => {
            dateMap[data.phases[i].id] = { start: s.startDate, end: s.endDate };
        });
    }

    data.phases.forEach((phase, index) => {
        const row = document.createElement('div');
        row.className = 'phase-row draggable-item';
        row.dataset.idx = index;
        row.draggable = true;

        // 選択状態の反映
        if (selectedPhaseIds.has(phase.id)) {
            row.classList.add('selected');
        }




        const isAnchor = data.anchorPhaseId === phase.id;
        const isParallel = !!phase.isParallel;




        if (isAnchor) {
            row.style.borderLeft = '3px solid var(--accent-primary)';
            row.style.background = 'rgba(56,189,248,0.08)';
        }

        let startDateVal = phase.manualStartDate || '';
        let endDateVal = phase.manualEndDate || '';

        if (!isParallel) {
            const sDates = dateMap[phase.id];
            if (sDates) {
                startDateVal = normalizeDateStr(sDates.start);
                endDateVal = normalizeDateStr(sDates.end);
            }
        }

        const escapedName = escapeHtml(phase.name);

        // アンカーラジオボタンの状態
        const isAnchorStart = isAnchor && data.anchorType === 'start';
        const isAnchorEnd = isAnchor && data.anchorType === 'end';

        row.innerHTML = `
            <div class="phase-handle">
                <span class="phase-index">#${index + 1}</span>
            </div>
            
            <div class="phase-content">
                <input type="text" class="phase-name-input" value="${escapedName}" data-idx="${index}">
            </div>
            
            <div class="phase-days">
                <input type="number" class="phase-days-input" value="${phase.days}" min="1" data-idx="${index}" ${isParallel ? 'readonly' : ''}>
                <span>days</span>
            </div>

            <div class="phase-anchor-dates">
                <div class="phase-date-row">
                    <label class="anchor-radio" title="この日付を開始基準に設定">
                        <input type="radio" name="anchor-select" class="anchor-start-radio" 
                               data-phase-id="${phase.id}" data-anchor-type="start" 
                               ${isAnchorStart ? 'checked' : ''} ${isParallel ? 'disabled' : ''}>
                        <span class="anchor-label">開始</span>
                    </label>
                    <input type="date" class="phase-start-input" data-idx="${index}" value="${startDateVal}" 
                           ${isParallel || isAnchorStart ? '' : 'disabled'}>
                </div>
                <div class="phase-date-row">
                    <label class="anchor-radio" title="この日付を完了基準に設定">
                        <input type="radio" name="anchor-select" class="anchor-end-radio" 
                               data-phase-id="${phase.id}" data-anchor-type="end" 
                               ${isAnchorEnd ? 'checked' : ''} ${isParallel ? 'disabled' : ''}>
                        <span class="anchor-label">完了</span>
                    </label>
                    <input type="date" class="phase-end-input" data-idx="${index}" value="${endDateVal}" 
                           ${isParallel || isAnchorEnd ? '' : 'disabled'}>
                </div>
            </div>

            <label class="phase-parallel" title="並行作業">
                <input type="checkbox" class="phase-parallel-chk" data-idx="${index}" ${isParallel ? 'checked' : ''} ${isAnchor ? 'disabled' : ''}>
                <span>並行</span>
            </label>

            <button class="icon-btn tag-btn" data-idx="${index}" title="タグ編集" style="font-size:0.9rem; margin-right: 2px;">🏷️</button>

            <!-- Tag Container (Always Visible) -->
            <div class="phase-tags-container" id="phase-tags-${phase.id}">
                ${renderPhaseTags(phase)}
            </div>

            <button class="icon-btn delete-btn" data-idx="${index}" title="削除">×</button>
        `;

        // タグ表示
        // Tag filter logic moved to end


        // Tag Filter Check (Moved to end to ensure priority)
        const filterVal = document.getElementById('tag-filter-select')?.value;
        if (filterVal) {
            // Check if tags match
            const hasTag = phase.tagIds && phase.tagIds.includes(filterVal);
            if (!hasTag) {
                row.style.setProperty('display', 'none', 'important');
                row.classList.add('row-hidden-by-filter');
            }
        }

        phaseListEl.appendChild(row);
    });
}

/**
 * アンカー選択を描画
 */
export function renderAnchorSelect() {
    if (!anchorPhaseSelect) return;
    const data = getActiveData();
    anchorPhaseSelect.innerHTML = '';
    data.phases.forEach(phase => {
        const opt = document.createElement('option');
        opt.value = phase.id;
        opt.textContent = escapeHtml(phase.name);
        opt.selected = phase.id === data.anchorPhaseId;
        anchorPhaseSelect.appendChild(opt);
    });
}

/**
 * トップコントロールを更新
 */
export function updateTopControls() {
    const data = getActiveData();
    if (anchorTypeRadios) {
        anchorTypeRadios.forEach(radio => {
            radio.checked = radio.value === data.anchorType;
        });
    }
    if (anchorDateInput && anchorDateInput.value !== data.anchorDate) {
        anchorDateInput.value = data.anchorDate;
    }
    if (holidaysInput) {
        holidaysInput.value = (appState.globalHolidays || []).join('\n');
    }

    // スプリント名バッジを更新
    const sprintNameBadge = document.getElementById('current-sprint-name');
    if (sprintNameBadge) {
        const activeTimeline = appState.timelines.find(t => t.id === appState.activeTimelineId);
        sprintNameBadge.textContent = activeTimeline ? activeTimeline.name : '';
    }
}

/**
 * スケジュール結果を描画
 */
export function renderSchedule() {
    if (!resultContainerEl) return;
    const schedule = calculateSchedule();
    const data = getActiveData();

    if (!schedule || !schedule.length) {
        resultContainerEl.innerHTML = '<div style="padding:2rem;text-align:center;">設定を確認してください</div>';
        return;
    }

    let displayList = [...schedule];
    if (data.sortOrder === 'asc') {
        displayList.reverse();
    }

    const sortBtn = document.getElementById('sort-toggle-btn');
    if (sortBtn) {
        const arrow = data.sortOrder === 'asc' ? '↓' : '↑';
        const label = data.sortOrder === 'asc' ? '昇順' : '降順';
        sortBtn.innerHTML = `<span>${label} ${arrow}</span>`;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:1.5rem; padding-top:1rem;">';

    // Tag Filter
    const filterVal = document.getElementById('tag-filter-select')?.value;

    displayList.forEach(item => {
        if (filterVal) {
            if (!item.tagIds || !item.tagIds.includes(filterVal)) return;
        }

        const isAnchor = item.id === data.anchorPhaseId;

        const highlight = isAnchor ? `border-left-color: var(--accent-primary); background: rgba(56, 189, 248, 0.05);` : '';
        const WORKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];
        const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()} (${WORKDAYS_JA[d.getDay()]})`;

        html += `
      <div class="timeline-item" style="${highlight}">
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
                <div class="timeline-title">${escapeHtml(item.name)}</div>
                <div class="timeline-subtitle">${item.days} 営業日</div>
            </div>
            <div style="text-align:right;">
                <div class="timeline-date" style="font-size:0.9rem; color:var(--text-primary);">
                   ${fmt(item.startDate)} - ${fmt(item.endDate)}
                </div>
            </div>
        </div>
      </div>`;
    });
    html += '</div>';
    resultContainerEl.innerHTML = html;
}

/**
 * ノードをクローンして置換（イベントリスナー削除用）
 */
export function replaceWithClone(node) {
    if (!node) return null;
    const clone = node.cloneNode(true);
    node.parentNode.replaceChild(clone, node);
    return clone;
}

/**
 * タグフィルターを描画
 */
export function renderTagFilter() {
    const select = document.getElementById('tag-filter-select');
    if (!select) return;

    // 現在の選択値を保持
    const currentVal = select.value;
    select.innerHTML = '<option value="">All Tags</option>';

    if (appState.tags) {
        appState.tags.forEach(tag => {
            const opt = document.createElement('option');
            opt.value = tag.id;
            opt.textContent = tag.name;
            if (tag.id === currentVal) opt.selected = true;
            select.appendChild(opt);
        });
    }
}


/**
 * DOM上の日付入力（開始・終了）の値を最新データで更新
 * （renderPhasesによる全再描画を避け、入力中のフォーカスを維持するため）
 */
function updatePhaseDateInputs() {
    const data = getActiveData();
    const startInputs = document.querySelectorAll('.phase-start-input');
    const endInputs = document.querySelectorAll('.phase-end-input');

    startInputs.forEach(input => {
        const idx = parseInt(input.dataset.idx, 10);
        if (data.phases[idx] && data.phases[idx].startDate) {
            input.value = normalizeDateStr(data.phases[idx].startDate);
        }
    });

    endInputs.forEach(input => {
        const idx = parseInt(input.dataset.idx, 10);
        if (data.phases[idx] && data.phases[idx].endDate) {
            input.value = normalizeDateStr(data.phases[idx].endDate);
        }
    });
}

export function attachPhaseListeners() {
    const list = document.getElementById('phase-list');
    if (!list) return;

    // Anchor Date Change (Inline)
    list.addEventListener('change', (e) => {
        if (e.target.classList.contains('phase-start-input') || e.target.classList.contains('phase-end-input')) {
            const idx = parseInt(e.target.dataset.idx, 10);
            const data = getActiveData();
            const phase = data.phases[idx];
            if (!phase) return;

            // If this input is enabled and it is NOT parallel, it must be the anchor input
            if (!phase.isParallel) {
                // Determine if it's start or end anchor
                const isAnchorStart = data.anchorPhaseId === phase.id && data.anchorType === 'start';
                const isAnchorEnd = data.anchorPhaseId === phase.id && data.anchorType === 'end';

                if ((isAnchorStart && e.target.classList.contains('phase-start-input')) ||
                    (isAnchorEnd && e.target.classList.contains('phase-end-input'))) {
                    // Update Anchor Date Implementation
                    data.anchorDate = normalizeDateStr(e.target.value);
                    data.phases = calculateSchedule(); // Update state
                    updatePhaseDateInputs(); // Update other inputs
                    renderSchedule();
                    renderGantt();
                    return; // Anchor update handles re-render naturally
                }
            }
        }
    });

    // Input Change (Name, Days)
    list.addEventListener('input', (e) => {
        if (e.target.classList.contains('phase-name-input')) {
            const idx = parseInt(e.target.dataset.idx, 10);
            const data = getActiveData();
            if (data.phases[idx]) {
                data.phases[idx].name = e.target.value;
                // Name change only, reschedule not strictly needed but good for consistency
                // data.phases = calculateSchedule(); 
                // Name doesn't affect dates, so just renderGantt is enough.
                renderGantt();
            }
        } else if (e.target.classList.contains('phase-days-input')) {
            const idx = parseInt(e.target.dataset.idx, 10);
            const data = getActiveData();
            if (data.phases[idx]) {
                const val = parseInt(e.target.value) || 1;
                data.phases[idx].days = Math.max(1, val);
                saveState();
                updateSchedule();
                renderPhases(); // 日付入力欄を最新値で再描画
            }
        }
    });

    // Checkbox / Radio / Buttons
    list.addEventListener('change', (e) => {
        // Parallel Checkbox
        if (e.target.classList.contains('phase-parallel-chk')) {
            const idx = parseInt(e.target.dataset.idx, 10);
            const data = getActiveData();
            if (data.phases[idx]) {
                data.phases[idx].isParallel = e.target.checked;
                // Parallel status change might affect anchor validity
                if (data.phases[idx].isParallel && data.anchorPhaseId === data.phases[idx].id) {
                    // Cannot be anchor if parallel -> logic should handle this or disable checkbox
                    // Current UI disables anchor radio if parallel, so this is edge case
                }
                data.phases = calculateSchedule(); // Update state
                renderPhases(); // Re-render to update disabled states
                renderSchedule();
                renderGantt();
            }
        }

        // Anchor Radio Selection
        if (e.target.name === 'anchor-select') {
            const phaseId = e.target.dataset.phaseId;
            const type = e.target.dataset.anchorType;
            const data = getActiveData();

            data.anchorPhaseId = phaseId;
            data.anchorType = type;

            data.phases = calculateSchedule(); // Update state
            renderPhases(); // Re-render to update inputs enablement
            renderSchedule();
            renderGantt();
        }
    });

    // Click Events (Tag, Delete)
    list.addEventListener('click', (e) => {
        // Tag Button
        if (e.target.closest('.tag-btn')) {
            const btn = e.target.closest('.tag-btn');
            const idx = parseInt(btn.dataset.idx, 10);
            openTagSelectionModal(idx);
        }

        // Delete Button
        if (e.target.closest('.delete-btn')) {
            const btn = e.target.closest('.delete-btn');
            const idx = parseInt(btn.dataset.idx, 10);
            if (confirm('この工程を削除しますか？')) {
                const data = getActiveData();
                data.phases.splice(idx, 1);

                // If deleted phase was anchor, reset anchor
                if (data.phases.length > 0 && !data.phases.find(p => p.id === data.anchorPhaseId)) {
                    data.anchorPhaseId = data.phases[0].id;
                    data.anchorType = 'end';
                }

                data.phases = calculateSchedule(); // Update state
                renderPhases();
                renderSchedule();
                renderGantt();
            }
        }
    });
}

/**
 * タグ管理画面を描画
 */
export function renderTagManager() {
    const container = document.getElementById('tag-manager-list');
    if (!container) return;
    container.innerHTML = '';

    if (!appState.tags) appState.tags = [];

    appState.tags.forEach(tag => {
        const item = document.createElement('div');
        item.className = 'tag-item-edit';

        const colorPreview = document.createElement('div');
        colorPreview.className = 'tag-color-preview';
        colorPreview.style.backgroundColor = tag.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = tag.name;
        nameSpan.style.fontSize = '0.9rem';

        const delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.className = 'icon-btn';
        delBtn.style.width = '20px';
        delBtn.style.height = '20px';
        delBtn.style.fontSize = '0.8rem';
        delBtn.onclick = () => {
            if (confirm(`タグ "${tag.name}" を削除しますか？`)) {
                deleteTag(tag.id);
                renderTagManager();
                renderPhases();
                renderSchedule();
            }
        };

        item.appendChild(colorPreview);
        item.appendChild(nameSpan);
        item.appendChild(delBtn);
        container.appendChild(item);
    });
}



/**
 * タグ選択モーダルを開く
 * @param {string} phaseIdx - フェーズのインデックス
 */
export function openTagSelectionModal(phaseIdx) {
    const modal = document.getElementById('tag-selection-modal');
    const container = document.getElementById('tag-selection-container');
    const okBtn = document.getElementById('tag-modal-ok-btn');
    const cancelBtn = document.getElementById('tag-modal-cancel-btn');

    if (!modal || !container) return;

    const data = getActiveData();
    const phase = data.phases[phaseIdx];
    if (!phase) return;

    // 現在の選択状態コピー
    let currentSelection = [...(phase.tagIds || [])];

    // レンダリング
    const renderOptions = () => {
        container.innerHTML = '';
        if (!appState.tags || appState.tags.length === 0) {
            container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#aaa;">タグがありません。<br>設定画面から作成してください。</p>';
            return;
        }

        appState.tags.forEach(tag => {
            const el = document.createElement('div');
            el.className = 'tag-select-option' + (currentSelection.includes(tag.id) ? ' selected' : '');
            el.textContent = tag.name;
            el.style.borderLeft = `4px solid ${tag.color}`;

            el.onclick = () => {
                if (currentSelection.includes(tag.id)) {
                    currentSelection = currentSelection.filter(id => id !== tag.id);
                } else {
                    if (currentSelection.length >= 3) {
                        alert("タグは最大3つまでです");
                        return;
                    }
                    currentSelection.push(tag.id);
                }
                renderOptions();
            };
            container.appendChild(el);
        });
    };

    renderOptions();
    modal.style.display = 'flex';

    // イベントハンドラ
    const cleanup = () => {
        modal.style.display = 'none';
        okBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
        // 保存処理
        // Phaseオブジェクトを直接更新する場合と、state.jsのアクションを使う場合
        // ここでは直接更新してsaveState + render
        phase.tagIds = currentSelection;
        saveState();
        renderPhases();
        renderSchedule(); // スケジュールリストのタグ表示更新
        cleanup();
    };

    cancelBtn.onclick = cleanup;
}

/**
 * Render tags for a phase as HTML string
 */
function renderPhaseTags(phase) {
    if (!phase.tagIds || phase.tagIds.length === 0 || !appState.tags) return '';

    let html = '';
    phase.tagIds.forEach(tId => {
        const t = appState.tags.find(tag => tag.id === tId);
        if (t) {
            html += `<span class="tag-badge small" style="border-left: 3px solid ${t.color}">${escapeHtml(t.name)}</span>`;
        }
    });
    return html;
}

/**
 * プリセット管理画面を描画
 * [NEW] Phase 13
 */
export function renderPresetManager() {
    const list = document.getElementById('preset-list');
    if (!list) return;
    list.innerHTML = '';

    // 1. Default Presets (Read-only)
    PRESETS.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'preset-item default-preset';
        item.innerHTML = `
            <span class="preset-name">${escapeHtml(preset.name)} <small>(Default)</small></span>
            <button class="btn-small apply-default-preset-btn" data-preset-name="${escapeHtml(preset.name)}">Apply</button>
        `;
        list.appendChild(item);
    });

    // 2. User Presets (Deletable)
    if (appSettings.presets && appSettings.presets.length > 0) {
        appSettings.presets.forEach((preset, index) => {
            const item = document.createElement('div');
            item.className = 'preset-item user-preset';
            item.innerHTML = `
                <span class="preset-name">${escapeHtml(preset.name)} <small>(User)</small></span>
                <div class="preset-actions">
                    <button class="btn-small apply-user-preset-btn" data-index="${index}">Apply</button>
                    <button class="icon-btn delete-preset-btn" data-index="${index}">×</button>
                </div>
            `;
            list.appendChild(item);
        });
    } else {
        const empty = document.createElement('div');
        empty.className = 'preset-item empty';
        empty.textContent = 'No user presets saved.';
        empty.style.color = '#aaa';
        empty.style.fontStyle = 'italic';
        list.appendChild(empty);
    }
}
