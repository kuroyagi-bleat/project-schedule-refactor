<!-- Approved -->
> **Approved by**: User
> **Date**: 2026-02-11
> **Phase**: Plan

# プリセット機能 (Phase Presets)

## Goal Description
ユーザーがよく使う工程パターン（例：「標準開発」「アジャイル」など）をプリセットとして保存・読み込みできるようにする。
また、祝日設定やプリセット等の「環境設定」と、プロジェクト固有の「スケジュールデータ」を分離し、管理しやすくする。

## User Review Required
> [!IMPORTANT]
> **データ構造の変更**:
> これまで `appState` に混在していた「祝日設定(`globalHolidays`)」を「環境設定(`appSettings`)」として分離します。
> これにより、**プロジェクトデータをリセットしても祝日設定やプリセットは保持される**ようになります。

> [!NOTE]
> **プリセットの適用**:
> プリセットの適用は**「新規作成（全クリア）」または「上書き」**として動作します。既存の工程に追加する機能は今回は実装しません。

## Proposed Changes

### [state.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/state.js)
#### [MODIFY] state.js
- `appSettings` オブジェクトを新設 ( `{ globalHolidays: [], presets: [] }` )。
- `saveSettings` / `loadSettings` 関数を追加（LocalStorageキー: `project-scheduler-settings`）。
- `appState` から `globalHolidays` を削除し、`appSettings` 側を参照するように Getter を調整。
- プリセット操作関数を追加:
    - `saveCurrentAsPreset(name)`: 現在の `activeTimeline` のフェーズリストをプリセットとして保存。
    - `deletePreset(index)`: プリセットを削除。
    - `applyPreset(index)`: 指定したプリセットで現在のタイムラインを上書き。

### [ui.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/ui.js)
#### [MODIFY] ui.js
- **設定パネル (`global-settings-panel`) の拡張**:
    - 「設定エクスポート/インポート」ボタンを追加。
    - 「プリセット管理」セクションを追加:
        - [登録] ボタン: 現在の工程を名前をつけて保存。
        - 保存済みプリセットリスト（適用ボタン、削除ボタン付き）。

### [main.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/main.js)
#### [MODIFY] main.js
- `attachTopListeners`:
    - 設定のエクスポート/インポート処理を追加。
    - `importJson`: 読み込んだJSONが「プロジェクトデータ」か「設定データ」かを判別して処理を分岐。

### [config.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/config.js)
#### [MODIFY] config.js
- デフォルトのプリセットデータ（標準的なウォーターフォールなど）を定義。

## Verification Plan

### Manual Verification
1.  **データ分離**:
    - 祝日を設定後、ページをリロードして保持されているか確認。
    - 「プロジェクトデータ」を削除（または新規スプリント作成）しても、祝日設定が残っているか確認。
2.  **プリセット保存**:
    - 独自の工程を作成し、「プリセットとして保存」する。
    - リストに表示されるか確認。
3.  **プリセット適用**:
    - 新しいスプリントを作成し、保存したプリセットを「適用」する。
    - 正しく工程が展開されるか確認。
4.  **インポート/エクスポート**:
    - 「設定データ」をエクスポートする。
    - ブラウザのデータをクリアした後、エクスポートしたファイルをインポートし、祝日とプリセットが復元されるか確認。
