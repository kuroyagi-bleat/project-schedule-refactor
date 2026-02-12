# ソース再チェック結果 (2026-02-12)

## 1. 対象
- `/Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/main.js`
- `/Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/index.html`
- `/Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/ui.js`
- `/Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/style.css`

## 2. 前回指摘の解消状況

### 解消済み
- `restoreState` の import漏れ
  - `src/main.js:11` で `restoreState` を import しており、`performUndo`/`performRedo` から呼べる状態。
- UI文言の日本語化
  - 設定/保存/読込/追加/画像保存など主要ラベルが日本語化済み。
  - 例: `src/index.html:47`, `src/index.html:84`, `src/index.html:136`, `src/index.html:149`
- タグフィルタ文言
  - `全てのタグ` に統一済み。
  - `src/index.html:147`, `src/ui.js:328`
- クリップボード出力の日付フォーマット
  - `YYYY-MM-DD` に修正済み。
  - `src/main.js:646`
- CSS重複の一部整理
  - `.phase-name-input` / `.phase-days` の重複上書きが大幅に整理。

### 継続改善余地
- `.date-separator` は重複定義が残存（動作影響は軽微）
  - `src/style.css:534`
  - `src/style.css:589`

## 3. 新規/残存の重要不具合

### P0: `showConfirm` / `showAlert` がボタン操作を受け付けない実装になっている
- 内容:
  - `showConfirm` / `showAlert` 内で `okBtn.onclick` / `cancelBtn.onclick` の設定が欠落している。
  - Promiseの `resolve(...)` を呼ぶ経路がなく、ダイアログ操作で処理が進まない可能性が高い。
- 影響:
  - 削除確認、アラート表示後の制御フローが停止または不定動作になる。
- 参照:
  - `src/main.js:108`
  - `src/main.js:130`
  - `src/main.js:145`
  - `src/main.js:168`
- 対応案:
  - `showConfirm` に以下を復元
    - `okBtn.onclick = () => { cleanup(); resolve(true); }`
    - `cancelBtn.onclick = () => { cleanup(); resolve(false); }`
    - `modal.onclick` のオーバーレイキャンセル
  - `showAlert` に以下を復元
    - `okBtn.onclick = () => { cleanup(); resolve(); }`
    - `modal.onclick` のオーバーレイ閉じる挙動（必要なら）

## 4. 総評
- 前回の主要改善（import漏れ、UI文言、日付フォーマット）は反映されている。
- ただし、ダイアログ系で P0 の回帰が入っており、先に修正しないと操作系に支障が出る。

## 5. 推奨対応順
1. `showConfirm` / `showAlert` の `onclick` と `resolve` 経路を復旧
2. 手動確認: スプリント削除、プリセット適用確認、タグ上限アラート、設定インポート失敗時アラート
3. 軽微なCSS重複（`.date-separator`）を整理

## 6. 備考
- 今回は静的レビューのみ。ブラウザ手動テストは未実施。
