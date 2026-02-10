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

/**
 * プリセット定義
 */
export const PRESETS = [
    {
        name: "標準開発 (Waterfall)",
        phases: [
            { id: 'p1', name: 'リリース準備', days: 1 },
            { id: 'p2', name: '受入テスト', days: 3 },
            { id: 'p3', name: '総合テスト', days: 5 },
            { id: 'p4', name: '結合テスト', days: 5 },
            { id: 'p5', name: '実装・単体テスト', days: 10 },
            { id: 'p6', name: '詳細設計', days: 5 },
            { id: 'p7', name: '基本設計', days: 5 },
            { id: 'p8', name: '要件定義', days: 5 },
        ]
    },
    {
        name: "アジャイル (Scrum Sprint)",
        phases: [
            { id: 's1', name: 'Sprint Review / Retro', days: 1 },
            { id: 's2', name: 'Development / QA', days: 8 },
            { id: 's3', name: 'Refinement', days: 2, parallelPhaseId: 's2' },
            { id: 's4', name: 'Sprint Planning', days: 1 },
        ]
    },
    {
        name: "Webサイト制作",
        phases: [
            { id: 'w1', name: '公開・納品', days: 1 },
            { id: 'w2', name: '最終確認・修正', days: 2 },
            { id: 'w3', name: 'コーディング', days: 5 },
            { id: 'w4', name: 'デザイン作成', days: 5 },
            { id: 'w5', name: '構成案(WF)', days: 3 },
            { id: 'w6', name: '要件ヒアリング', days: 2 }
        ]
    }
];
