// dateUtils.js - 日付計算ヘルパー関数
// Phase 1: コード基盤整備

import { getGlobalHolidays } from './state.js';

/**
 * 週末かどうかを判定
 * @param {Date} date - 判定する日付
 * @returns {boolean}
 */
export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 * @param {Date} date - 変換する日付
 * @returns {string}
 */
export function normalizeDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 祝日かどうかを判定
 * @param {Date} date - 判定する日付
 * @returns {boolean}
 */
export function isHoliday(date) {
    const str = normalizeDateStr(date);
    return getGlobalHolidays().includes(str);
}

/**
 * 営業日かどうかを判定
 * @param {Date} date - 判定する日付
 * @returns {boolean}
 */
export function isWorkingDay(date) {
    return !isWeekend(date) && !isHoliday(date);
}

/**
 * 営業日を減算
 * @param {Date} startDate - 開始日
 * @param {number} daysToSubtract - 減算する営業日数
 * @returns {Date}
 */
export function subBusinessDays(startDate, daysToSubtract) {
    let date = new Date(startDate.getTime());
    let daysLeft = daysToSubtract;
    while (daysLeft > 0) {
        date.setDate(date.getDate() - 1);
        if (isWorkingDay(date)) daysLeft--;
    }
    return date;
}

/**
 * 営業日を加算
 * @param {Date} startDate - 開始日
 * @param {number} daysToAdd - 加算する営業日数
 * @returns {Date}
 */
export function addBusinessDays(startDate, daysToAdd) {
    let date = new Date(startDate.getTime());
    let daysLeft = daysToAdd;
    while (daysLeft > 0) {
        date.setDate(date.getDate() + 1);
        if (isWorkingDay(date)) daysLeft--;
    }
    return date;
}

/**
 * 営業日になるまで過去方向に調整
 * @param {Date} date - 調整する日付
 * @returns {Date}
 */
export function ensureWorkingDayBackward(date) {
    let d = new Date(date.getTime());
    while (!isWorkingDay(d)) d.setDate(d.getDate() - 1);
    return d;
}

/**
 * 営業日になるまで未来方向に調整
 * @param {Date} date - 調整する日付
 * @returns {Date}
 */
export function ensureWorkingDayForward(date) {
    let d = new Date(date.getTime());
    while (!isWorkingDay(d)) d.setDate(d.getDate() + 1);
    return d;
}

/**
 * 2つの日付間の日数差を計算
 * @param {Date} d1 - 開始日
 * @param {Date} d2 - 終了日
 * @returns {number}
 */
export function getDaysDiff(d1, d2) {
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
}
