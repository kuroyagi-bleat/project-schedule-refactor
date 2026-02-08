// gantt.js - ガントチャート描画
// Phase 1: コード基盤整備

import { appState, getActiveData, saveState } from './state.js';
import { calculateSchedule, getDaysDiff } from './scheduler.js';
import { isWeekend, isHoliday, normalizeDateStr } from './dateUtils.js';
import { escapeHtml, renderPhases } from './ui.js';
import { CONFIG } from './config.js';

/**
 * ドラッグ状態
 */
let ganttDragState = {
    active: false,
    type: null, // 'move' | 'resize'
    startX: 0,
    initialLeft: 0,
    initialWidth: 0,
    phaseId: null,
    timelineId: null,
    initialDate: null,
    initialDays: 0,
    targetBar: null
};

/**
 * ガントチャートを描画
 */
export function renderGantt() {
    const container = document.getElementById('gantt-container');
    if (!container) return;

    container.innerHTML = '';

    const PX_PER_DAY = CONFIG.PX_PER_DAY;

    // 全タイムラインからスケジュールを収集
    const allData = [];
    appState.timelines.forEach(t => {
        const sch = calculateSchedule(t.data);
        if (sch && sch.length) {
            allData.push({ info: t, schedule: sch });
        }
    });

    if (!allData.length) {
        container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">データがありません</p>';
        return;
    }

    // 日付範囲を計算
    let minDate = Infinity, maxDate = -Infinity;
    allData.forEach(g => {
        g.schedule.forEach(item => {
            if (item.startDate < minDate) minDate = item.startDate.getTime();
            if (item.endDate > maxDate) maxDate = item.endDate.getTime();
        });
    });

    minDate = new Date(minDate);
    maxDate = new Date(maxDate);
    const totalDays = getDaysDiff(minDate, maxDate);

    // グリッド列を生成
    const gridCols = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate.getTime());
        d.setDate(d.getDate() + i);
        gridCols.push({
            date: d,
            isWeekend: isWeekend(d),
            isHoliday: isHoliday(d)
        });
    }

    // キャンバス作成
    const canvas = document.createElement('div');
    canvas.className = 'gantt-canvas';
    canvas.style.width = `${totalDays * PX_PER_DAY}px`;
    canvas.style.minWidth = '100%';
    canvas.style.position = 'relative';

    // ヘッダー描画
    const LABEL_WIDTH = 120;  // 工程名ラベルの幅（先に定義）
    const header = document.createElement('div');
    header.className = 'gantt-header';
    header.style.display = 'flex';
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '10';
    header.style.backgroundColor = '#1e293b';

    // ラベル列のプレースホルダー
    const labelPlaceholder = document.createElement('div');
    labelPlaceholder.className = 'gantt-header-label';
    labelPlaceholder.style.width = `${LABEL_WIDTH}px`;
    labelPlaceholder.style.minWidth = `${LABEL_WIDTH}px`;
    labelPlaceholder.style.fontSize = '0.65rem';
    labelPlaceholder.style.padding = '0.25rem 0.5rem';
    labelPlaceholder.style.color = 'var(--text-muted)';
    labelPlaceholder.textContent = '工程名';
    header.appendChild(labelPlaceholder);

    gridCols.forEach((col) => {
        const cell = document.createElement('div');
        cell.className = 'gantt-header-cell';
        cell.style.width = `${PX_PER_DAY}px`;
        cell.style.textAlign = 'center';
        cell.style.fontSize = '0.65rem';
        cell.style.borderRight = '1px solid rgba(255,255,255,0.1)';
        cell.style.padding = '0.25rem 0';

        if (col.isWeekend) cell.classList.add('gantt-weekend');
        if (col.isHoliday) cell.classList.add('gantt-holiday');

        cell.innerHTML = `<div>${col.date.getMonth() + 1}/${col.date.getDate()}</div>`;
        header.appendChild(cell);
    });

    canvas.appendChild(header);

    // 行描画（LABEL_WIDTHはヘッダー部分で定義済み）
    allData.forEach(group => {
        // スプリントタイトル行
        const titleRow = document.createElement('div');
        titleRow.className = 'gantt-row gantt-sprint-title';
        titleRow.style.height = '28px';
        titleRow.style.position = 'relative';
        titleRow.style.marginTop = '8px';
        titleRow.style.marginBottom = '4px';
        titleRow.style.display = 'flex';
        titleRow.style.alignItems = 'center';
        titleRow.style.background = 'rgba(56, 189, 248, 0.15)';
        titleRow.style.borderRadius = '4px';

        const titleLabel = document.createElement('div');
        titleLabel.className = 'gantt-sprint-label';
        titleLabel.style.position = 'sticky';
        titleLabel.style.left = '0';
        titleLabel.style.zIndex = '5';
        titleLabel.style.width = `${LABEL_WIDTH}px`;
        titleLabel.style.minWidth = `${LABEL_WIDTH}px`;
        titleLabel.style.paddingLeft = '0.5rem';
        titleLabel.style.fontWeight = 'bold';
        titleLabel.style.fontSize = '0.8rem';
        titleLabel.style.color = 'var(--accent-primary)';
        titleLabel.style.backgroundColor = 'var(--bg-secondary)';
        titleLabel.style.overflow = 'hidden';
        titleLabel.style.textOverflow = 'ellipsis';
        titleLabel.style.whiteSpace = 'nowrap';
        titleLabel.textContent = `📌 ${escapeHtml(group.info.name)}`;
        titleRow.appendChild(titleLabel);

        canvas.appendChild(titleRow);

        // 各フェーズの行
        group.schedule.forEach(item => {
            const row = document.createElement('div');
            row.className = 'gantt-row';
            row.style.height = '32px';
            row.style.position = 'relative';
            row.style.marginBottom = '4px';
            row.style.display = 'flex';
            row.style.alignItems = 'center';

            // 工程名ラベル（左側sticky固定）
            const label = document.createElement('div');
            label.className = 'gantt-phase-label';
            label.style.position = 'sticky';
            label.style.left = '0';
            label.style.zIndex = '5';
            label.style.width = `${LABEL_WIDTH}px`;
            label.style.minWidth = `${LABEL_WIDTH}px`;
            label.style.paddingLeft = '0.75rem';
            label.style.fontSize = '0.75rem';
            label.style.color = 'var(--text-secondary)';
            label.style.backgroundColor = 'var(--bg-secondary)';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.whiteSpace = 'nowrap';
            label.textContent = escapeHtml(item.name);
            row.appendChild(label);

            // バーコンテナ（相対位置の基準）
            const barContainer = document.createElement('div');
            barContainer.className = 'gantt-bar-container';
            barContainer.style.position = 'relative';
            barContainer.style.flex = '1';
            barContainer.style.height = '100%';

            const dayOffset = getDaysDiff(minDate, item.startDate) - 1;
            const barWidth = getDaysDiff(item.startDate, item.endDate);

            const bar = document.createElement('div');
            bar.className = 'gantt-bar';
            bar.dataset.id = item.id;
            bar.dataset.timelineId = group.info.id;
            bar.style.position = 'absolute';
            bar.style.left = `${dayOffset * PX_PER_DAY}px`;
            bar.style.width = `${barWidth * PX_PER_DAY}px`;
            bar.style.height = '28px';
            bar.style.top = '2px';
            bar.style.cursor = 'grab';
            bar.style.display = 'flex';
            bar.style.alignItems = 'center';
            bar.style.paddingLeft = '0.5rem';
            bar.style.borderRadius = '4px';
            bar.style.fontSize = '0.75rem';
            bar.style.overflow = 'hidden';
            bar.style.whiteSpace = 'nowrap';
            bar.style.textOverflow = 'ellipsis';

            // Anchor判定
            const isAnchor = item.id === group.info.data.anchorPhaseId;
            const isParallel = group.info.data.phases.find(p => p.id === item.id)?.isParallel;

            // スタイル設定
            if (isAnchor) {
                bar.style.background = 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)';
                bar.style.color = '#0f172a';
                bar.style.fontWeight = 'bold';
            } else if (isParallel) {
                bar.style.background = 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)';
                bar.style.opacity = '0.85';
            } else {
                bar.style.background = 'rgba(255,255,255,0.2)';
            }

            // バー内のテキストは日数を表示（工程名は左ラベルに移動したため）
            bar.textContent = `${item.days}日`;

            // リサイズハンドル
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            handle.dataset.id = item.id;
            handle.dataset.timelineId = group.info.id;
            handle.style.position = 'absolute';
            handle.style.right = '0';
            handle.style.top = '0';
            handle.style.width = '8px';
            handle.style.height = '100%';
            handle.style.cursor = 'col-resize';
            bar.appendChild(handle);

            barContainer.appendChild(bar);
            row.appendChild(barContainer);
            canvas.appendChild(row);
        });
    });

    // グリッド線
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'gantt-grid-lines';
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.top = '0';
    gridOverlay.style.left = '0';
    gridOverlay.style.width = '100%';
    gridOverlay.style.height = '100%';
    gridOverlay.style.display = 'flex';
    gridOverlay.style.zIndex = '0';
    gridOverlay.style.pointerEvents = 'none';

    gridCols.forEach((col) => {
        const line = document.createElement('div');
        line.style.width = `${PX_PER_DAY}px`;
        line.style.borderRight = '1px solid rgba(255,255,255,0.05)';
        line.style.height = '100%';
        if (col.isWeekend) line.style.backgroundColor = 'rgba(239,68,68,0.1)';
        if (col.isHoliday) line.style.backgroundColor = 'rgba(251,191,36,0.2)';
        gridOverlay.appendChild(line);
    });

    canvas.insertBefore(gridOverlay, canvas.firstChild);
    container.appendChild(canvas);

    attachGanttListeners(container, PX_PER_DAY);
}

/**
 * ガントチャートイベントリスナーを設定
 */
function attachGanttListeners(container, pxPerDay) {
    if (container.dataset.listening) return;
    container.dataset.listening = 'true';

    container.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.resize-handle');
        const bar = e.target.closest('.gantt-bar');

        if (handle) {
            e.preventDefault();
            e.stopPropagation();
            startDrag(e, 'resize', handle.parentElement, handle.dataset.id, handle.dataset.timelineId, pxPerDay);
        } else if (bar) {
            e.preventDefault();
            startDrag(e, 'move', bar, bar.dataset.id, bar.dataset.timelineId, pxPerDay);
        }
    });

    const onMouseMove = (e) => {
        if (!ganttDragState.active) return;

        const deltaX = e.clientX - ganttDragState.startX;
        const pxPerDay = ganttDragState.pxPerDay;

        if (ganttDragState.type === 'move') {
            ganttDragState.targetBar.style.transform = `translateX(${deltaX}px)`;
        } else if (ganttDragState.type === 'resize') {
            const newW = Math.max(pxPerDay, ganttDragState.initialWidth + deltaX);
            ganttDragState.targetBar.style.width = `${newW}px`;
        }
    };

    const onMouseUp = (e) => {
        if (!ganttDragState.active) return;

        const deltaX = e.clientX - ganttDragState.startX;
        const deltaDays = Math.round(deltaX / ganttDragState.pxPerDay);

        applyGanttChange(deltaDays);

        ganttDragState.active = false;
        if (ganttDragState.targetBar) {
            ganttDragState.targetBar.style.transform = '';
            ganttDragState.targetBar.classList.remove('dragging');
            ganttDragState.targetBar.classList.remove('active-drag');
            ganttDragState.targetBar = null;
        }

        document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

/**
 * ドラッグ開始
 */
function startDrag(e, type, bar, phaseId, timelineId, pxPerDay) {
    ganttDragState.active = true;
    ganttDragState.type = type;
    ganttDragState.startX = e.clientX;
    ganttDragState.targetBar = bar;
    ganttDragState.phaseId = phaseId;
    ganttDragState.timelineId = timelineId;
    ganttDragState.pxPerDay = pxPerDay;

    const rect = bar.getBoundingClientRect();
    ganttDragState.initialWidth = rect.width;

    const timeline = appState.timelines.find(t => t.id === timelineId);
    if (!timeline) return;

    const phase = timeline.data.phases.find(p => p.id === phaseId);
    if (!phase) return;

    ganttDragState.initialDays = phase.days;

    bar.classList.add('dragging');
    bar.classList.add('active-drag');
    document.body.style.cursor = type === 'move' ? 'grabbing' : 'col-resize';
}

/**
 * ガントチャート変更を適用
 */
function applyGanttChange(deltaDays) {
    if (deltaDays === 0) return;

    const { type, phaseId, timelineId, initialDays } = ganttDragState;
    const timeline = appState.timelines.find(t => t.id === timelineId);
    if (!timeline) return;

    const data = timeline.data;
    const phase = data.phases.find(p => p.id === phaseId);
    if (!phase) return;

    const iso = (d) => normalizeDateStr(d);

    if (type === 'resize') {
        const newDays = initialDays + deltaDays;
        phase.days = Math.max(1, newDays);

        if (phase.isParallel) {
            const startStr = phase.manualStartDate || data.anchorDate;
            const start = new Date(startStr);
            const end = new Date(startStr);
            end.setDate(end.getDate() + newDays);
            phase.manualEndDate = iso(end);
        }
    } else if (type === 'move') {
        if (phase.id === data.anchorPhaseId) {
            const currentAnchor = new Date(data.anchorDate);
            currentAnchor.setDate(currentAnchor.getDate() + deltaDays);
            data.anchorDate = iso(currentAnchor);
        } else {
            let tempStart, tempEnd;

            if (phase.isParallel && phase.manualStartDate) {
                tempStart = new Date(phase.manualStartDate);
                tempEnd = new Date(phase.manualEndDate);
            } else {
                const sch = calculateSchedule(data);
                const item = sch.find(i => i.id === phaseId);
                if (item) {
                    tempStart = new Date(item.startDate);
                    tempEnd = new Date(item.endDate);
                } else {
                    tempStart = new Date(data.anchorDate);
                    tempEnd = new Date(data.anchorDate);
                }
            }

            const proposedStart = new Date(tempStart);
            const proposedEnd = new Date(tempEnd);
            proposedStart.setDate(proposedStart.getDate() + deltaDays);
            proposedEnd.setDate(proposedEnd.getDate() + deltaDays);

            if (!phase.isParallel) {
                phase.isParallel = true;
                phase.manualStartDate = iso(tempStart);
                phase.manualEndDate = iso(tempEnd);
            }

            phase.manualStartDate = iso(proposedStart);
            phase.manualEndDate = iso(proposedEnd);
        }
    }

    saveState();
    renderPhases();
    updateSchedule();
}

/**
 * スケジュールを更新（外部から注入される関数を使用）
 */
let scheduleUpdateCallback = null;

export function setScheduleUpdateCallback(callback) {
    scheduleUpdateCallback = callback;
}

export function updateSchedule() {
    if (scheduleUpdateCallback) {
        scheduleUpdateCallback();
    }
    renderGantt();
}
