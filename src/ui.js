// ui.js - DOM操作とレンダリング
// Phase 1: コード基盤整備

import { appState, getActiveData, getActiveTimeline, saveState } from './state.js';
import { calculateSchedule, getDaysDiff } from './scheduler.js';
import { normalizeDateStr } from './dateUtils.js';

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
            
            <label class="phase-parallel" title="並行作業">
                <input type="checkbox" class="phase-parallel-chk" data-idx="${index}" ${isParallel ? 'checked' : ''} ${isAnchor ? 'disabled' : ''}>
                <span>並行</span>
            </label>
            
            <div class="phase-anchor-dates">
                <label class="anchor-radio" title="この日付を開始基準に設定">
                    <input type="radio" name="anchor-select" class="anchor-start-radio" 
                           data-phase-id="${phase.id}" data-anchor-type="start" 
                           ${isAnchorStart ? 'checked' : ''} ${isParallel ? 'disabled' : ''}>
                    <span class="anchor-label">開始</span>
                </label>
                <input type="date" class="phase-start-input" data-idx="${index}" value="${startDateVal}" ${!isParallel ? 'disabled' : ''}>
                <span class="date-separator">-</span>
                <label class="anchor-radio" title="この日付を完了基準に設定">
                    <input type="radio" name="anchor-select" class="anchor-end-radio" 
                           data-phase-id="${phase.id}" data-anchor-type="end" 
                           ${isAnchorEnd ? 'checked' : ''} ${isParallel ? 'disabled' : ''}>
                    <span class="anchor-label">完了</span>
                </label>
                <input type="date" class="phase-end-input" data-idx="${index}" value="${endDateVal}" ${!isParallel ? 'disabled' : ''}>
            </div>

            <div class="phase-days">
                <input type="number" class="phase-days-input" value="${phase.days}" min="1" data-idx="${index}" ${isParallel ? 'readonly' : ''}>
                <span>days</span>
            </div>

            <button class="icon-btn delete-btn" data-idx="${index}" title="削除">×</button>
        `;
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
    displayList.forEach(item => {
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
