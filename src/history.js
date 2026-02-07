// history.js - Undo/Redo 履歴管理
// Phase 3: 機能強化

const MAX_HISTORY = 50;

// 履歴スタック
let historyStack = [];
let currentIndex = -1;

/**
 * 状態のディープコピーを作成
 * @param {Object} state - コピーする状態
 * @returns {Object} ディープコピーされた状態
 */
function deepClone(state) {
    return JSON.parse(JSON.stringify(state));
}

/**
 * 履歴に状態を追加
 * @param {Object} state - 保存する状態
 */
export function pushHistory(state) {
    // 現在位置より後の履歴を削除（Redo履歴をクリア）
    if (currentIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, currentIndex + 1);
    }

    // 状態をディープコピーして保存
    historyStack.push(deepClone(state));
    currentIndex = historyStack.length - 1;

    // 最大履歴数を超えたら古いものを削除
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
        currentIndex--;
    }
}

/**
 * Undoできるか確認
 * @returns {boolean}
 */
export function canUndo() {
    return currentIndex > 0;
}

/**
 * Redoできるか確認
 * @returns {boolean}
 */
export function canRedo() {
    return currentIndex < historyStack.length - 1;
}

/**
 * Undo - 1つ前の状態に戻る
 * @returns {Object|null} 復元された状態、またはnull
 */
export function undo() {
    if (!canUndo()) return null;
    currentIndex--;
    return deepClone(historyStack[currentIndex]);
}

/**
 * Redo - 1つ先の状態に進む
 * @returns {Object|null} 復元された状態、またはnull
 */
export function redo() {
    if (!canRedo()) return null;
    currentIndex++;
    return deepClone(historyStack[currentIndex]);
}

/**
 * 履歴をクリア
 */
export function clearHistory() {
    historyStack = [];
    currentIndex = -1;
}

/**
 * 現在の履歴状態を取得（デバッグ用）
 * @returns {Object}
 */
export function getHistoryState() {
    return {
        currentIndex,
        totalCount: historyStack.length,
        canUndo: canUndo(),
        canRedo: canRedo()
    };
}
