// scheduler.js - スケジュール計算ロジック
// Phase 1: コード基盤整備

import { getActiveData } from './state.js';
import {
    subBusinessDays,
    addBusinessDays,
    ensureWorkingDayBackward,
    ensureWorkingDayForward,
    getDaysDiff,
    getBusinessDaysDiff
} from './dateUtils.js';

// getDaysDiffをre-export
export { getDaysDiff } from './dateUtils.js';

/**
 * スケジュールを計算
 * @param {Object|null} targetData - 計算対象のデータ（nullの場合はアクティブデータを使用）
 * @returns {Array|null} 計算結果の配列
 */
export function calculateSchedule(targetData = null) {
    const data = targetData || getActiveData();
    if (!data.anchorDate || !data.phases.length) return null;

    const anchorIndex = data.phases.findIndex(p => p.id === data.anchorPhaseId);
    if (anchorIndex === -1 && data.phases.length > 0) {
        data.anchorPhaseId = data.phases[0].id;
        return calculateSchedule(data);
    }
    if (anchorIndex === -1) return [];

    const results = new Array(data.phases.length);
    const anchorDateObj = new Date(data.anchorDate);
    const anchorPhase = data.phases[anchorIndex];

    // 並行タスクの処理
    const processParallel = (idx) => {
        const p = data.phases[idx];
        if (p.isParallel) {
            let s = p.manualStartDate ? new Date(p.manualStartDate) : new Date(data.anchorDate);
            let e = p.manualEndDate ? new Date(p.manualEndDate) : addBusinessDays(s, p.days - 1);
            const diff = getBusinessDaysDiff(s, e);
            p.days = diff; // 計算された営業日数をデータに反映
            return { ...p, startDate: s, endDate: e, days: diff };
        }
        return null;
    };

    // アンカー計算
    let anchorStart, anchorEnd;

    if (data.anchorType === 'end') {
        anchorEnd = ensureWorkingDayBackward(anchorDateObj);
        anchorStart = subBusinessDays(anchorEnd, Math.max(0, anchorPhase.days - 1));
    } else {
        anchorStart = ensureWorkingDayForward(anchorDateObj);
        anchorEnd = addBusinessDays(anchorStart, Math.max(0, anchorPhase.days - 1));
    }

    results[anchorIndex] = { ...anchorPhase, startDate: anchorStart, endDate: anchorEnd };

    // 前方チェーン（アンカーより前の工程）
    let nextRefDate = anchorStart;
    for (let i = anchorIndex - 1; i >= 0; i--) {
        const parallelRes = processParallel(i);
        if (parallelRes) {
            results[i] = parallelRes;
            continue;
        }
        let end = subBusinessDays(nextRefDate, 1);
        let start = subBusinessDays(end, Math.max(0, data.phases[i].days - 1));
        results[i] = { ...data.phases[i], startDate: start, endDate: end };
        nextRefDate = start;
    }

    // 後方チェーン（アンカーより後の工程）
    let prevRefDate = anchorEnd;
    for (let i = anchorIndex + 1; i < data.phases.length; i++) {
        const parallelRes = processParallel(i);
        if (parallelRes) {
            results[i] = parallelRes;
            continue;
        }
        let start = addBusinessDays(prevRefDate, 1);
        let end = addBusinessDays(start, Math.max(0, data.phases[i].days - 1));
        results[i] = { ...data.phases[i], startDate: start, endDate: end };
        prevRefDate = end;
    }

    return results;
}
