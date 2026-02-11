# ソースレビュー & UI改善提案 (2026-02-11)

## 1. 対象
- `src/index.html`
- `src/main.js`
- `src/ui.js`
- `src/style.css`
- `src/state.js`
- `src/scheduler.js`

## 2. 重要な修正候補（実装優先）

### P0: Undo/Redo 実行時に `restoreState` が未定義になる
- 内容: `main.js` 内で `restoreState(...)` を呼んでいるが、`state.js` から import されていない。
- 影響: Undo/Redo 操作時にランタイムエラーとなる可能性が高い。
- 参照:
  - `src/main.js:262`
  - `src/main.js:273`
  - `src/main.js:7`
  - `src/state.js:225`
- 対応案: `main.js` の import に `restoreState` を追加する。

### P1: モーダルのキーボードイベントが蓄積する
- 内容: `showConfirm` / `showAlert` で `document.addEventListener('keydown', ...)` を都度追加しているが、OK/キャンセル時に確実に remove されない。
- 影響: ダイアログ開閉を繰り返すと意図しない多重反応やメモリリークにつながる。
- 参照:
  - `src/main.js:148`
  - `src/main.js:198`
- 対応案: ハンドラ参照を `cleanup` 側で必ず `removeEventListener` する構成に統一する。

### P1: `ui.js` に未使用の `attachPhaseListeners` 実装が残存
- 内容: 実際のイベント登録は `main.js` 側で行っているが、`ui.js` に別実装の `attachPhaseListeners` が存在する。
- 影響: 将来改修時に片方だけ修正され、挙動差分や回帰を起こしやすい。
- 参照:
  - `src/ui.js:366`
  - `src/main.js:351`
- 対応案: 使用していない側を削除、または責務を一本化する。

## 3. UI/UX 改善候補（低リスク）

### U1: 文言の言語混在を整理
- 内容: 日本語と英語ラベルが混在（例: `環境Settings`, `Save (Env)`, `Add Step`, `All Tags` など）。
- 影響: 初見ユーザーの理解コストが上がる。
- 参照:
  - `src/index.html:47`
  - `src/index.html:49`
  - `src/index.html:136`
  - `src/index.html:147`
- 対応案: UI文言を日本語へ統一（必要なら括弧で英語併記）。

### U2: 設定パネル開閉ボタンに状態表示を追加
- 内容: 現在はアイコンのみで、開閉状態が視覚的に分かりにくい。
- 影響: 設定パネルの存在を見失いやすい。
- 参照:
  - `src/index.html:36`
  - `src/main.js:691`
- 対応案: `aria-expanded` とボタンラベル（例: `設定を開く/閉じる`）を同期更新する。

### U3: 出力テキストの日付フォーマットを修正
- 内容: クリップボード出力が `2026 -02 -11` のように不自然な空白を含む。
- 影響: 外部共有時の読みづらさ。
- 参照:
  - `src/main.js:675`
- 対応案: `YYYY-MM-DD` 形式に統一する。

### U4: CSS の重複定義整理
- 内容: `.phase-days` / `.phase-name-input` が複数回定義され、後勝ちで挙動が分かりにくい。
- 影響: 微調整時の予期しない崩れ。
- 参照:
  - `src/style.css:544`
  - `src/style.css:600`
  - `src/style.css:472`
  - `src/style.css:619`
- 対応案: 最終的に有効なルールを1か所へ統合する。

## 4. 推奨着手順
1. P0 (`restoreState` import漏れ) を最優先で修正
2. P1（モーダルイベントのクリーンアップ）を修正
3. P1（イベント実装の一本化）で保守負債を削減
4. U1/U3/U4 の低リスクUI改善をまとめて適用

## 5. 備考
- 今回は調査結果の記録のみで、ソースコード自体の変更は行っていない。
