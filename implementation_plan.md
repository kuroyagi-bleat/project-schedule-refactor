# 行程の複数選択・一括移動 (Multi-Phase Reordering)

## Goal Description
既存のドラッグ＆ドロップ機能（単一移動）を拡張し、複数工程を選択してまとめて移動できるようにする。
`Shift` キー（範囲選択）や `Cmd/Ctrl` キー（個別追加選択）に対応し、選択された複数の工程を一度のドラッグ操作で移動させる。

## User Review Required
> [!NOTE]
> 複数移動時のドロップ挙動：
> 選択されたアイテム群は、ドロップ先の位置に**連続して**挿入されます。元の位置関係（飛び地選択など）は維持されず、ドロップ先でひとかたまりになります。

## Proposed Changes

### [state.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/state.js)
#### [MODIFY] state.js
- `appState` に `selectedPhaseIds` (Set or Array) を追加し、選択中のフェーズIDを管理する。
- 選択状態を操作するアクション関数 (`selectPhase`, `deselectPhase`, `clearSelection`, `toggleSelection`) を追加。

### [ui.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/ui.js)
#### [MODIFY] ui.js
- `renderPhases` で、`selectedPhaseIds` に含まれる行に `.selected` クラスを付与。
- クリックイベントハンドラを拡張（または `main.js` 側の修正）:
    - 通常クリック: その行のみ選択（他は解除）
    - `Cmd/Ctrl` + Click: 選択状態のトグル
    - `Shift` + Click: 直前の選択行から現在の行までの範囲選択
- ドラッグ開始 (`dragstart`) 処理の修正:
    - 選択中のアイテムがない場合は、ドラッグ対象の行だけを選択状態にする。
    - ドラッグデータ (`dataTransfer`) に、選択された全アイテムのインデックスリストを設定。
- ドロップ (`drop`) 処理の修正:
    - データ転送からインデックスリストを取得。
    - 配列操作: 選択されたアイテムを配列から抜き取り、ドロップ位置にまとめて挿入する。

### [style.css](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/style.css)
#### [MODIFY] style.css
- `.phase-item.selected`: 選択中のスタイル（背景色変更など）。
- `.phase-item.dragging`: ドラッグ中のスタイル（半透明など）。

## Verification Plan

### Manual Verification
1. **通常クリック**: 1行だけ選択されること。
2. **Cmd/Ctrl + クリック**: 複数行が飛び飛びで選択できること。
3. **Shift + クリック**: 範囲選択ができること。
4. **ドラッグ＆ドロップ**:
    - 複数選択状態でドラッグを開始し、別の場所にドロップする。
    - 選択された全アイテムが、ドロップ位置にまとめて移動すること。
    - スケジュール（日付）が正しく再計算されること。
