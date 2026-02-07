// config.js - 定数とデフォルト設定
// Phase 1: コード基盤整備

/**
 * アプリケーション設定
 */
export const CONFIG = {
    STORAGE_KEY: 'scheduleAppState',
    OLD_STORAGE_KEY: 'scheduleState',
    PX_PER_DAY: 30,
};

/**
 * デフォルトのフェーズ設定
 */
export const defaultPhaseConfig = [
    { id: '1', name: 'リリース準備', days: 1 },
    { id: '2', name: '受入テスト', days: 3 },
    { id: '3', name: '総合テスト', days: 5 },
    { id: '4', name: '結合テスト', days: 5 },
    { id: '5', name: '実装・単体テスト', days: 10 },
    { id: '6', name: '詳細設計', days: 5 },
    { id: '7', name: '基本設計', days: 5 },
    { id: '8', name: '要件定義', days: 5 },
];

/**
 * デフォルトのタイムラインデータを生成
 */
export function createDefaultTimelineData() {
    return {
        anchorDate: new Date().toISOString().split('T')[0],
        anchorPhaseId: '1',
        anchorType: 'end',
        sortOrder: 'asc',
        phases: JSON.parse(JSON.stringify(defaultPhaseConfig))
    };
}
