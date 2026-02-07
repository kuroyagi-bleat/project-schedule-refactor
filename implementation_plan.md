# Phase 2 実装計画書: UI/UXリデザイン

<!-- Approved -->
> **Approved by**: wakaumekenji
> **Date**: 2026-02-08 01:38
> **Phase**: Implementation Plan

**作成日**: 2026-02-08
**対象Phase**: Phase 2 - UI/UXリデザイン (Redesign)

---

## 目的

ビジネスツールとしての使いやすさを向上させるため、UIの簡素化とデザインの最適化を行う。

---

## 変更概要

### 2-1. Timeline Configuration セクションの廃止

**現状の問題**:
- 「Anchor Settings」が Timeline Configuration と Phase Steps の両方で設定可能
- 情報の重複、ユーザーの混乱

**変更内容**:
- Timeline Configuration セクションを削除
- Timeline 選択機能をヘッダーに移動
- Anchor 設定を Phase Steps 内のみに統合

---

### 2-2. マージン・パディングの縮小

**現状の問題**:
- `padding: 2rem`, `margin-bottom: 2rem` が多用され情報密度が低い
- スクロール量が増加

**変更内容**:
- Glass card の padding: `1.5rem` → `1rem`
- セクション間 margin: `2rem` → `1rem`
- 全体的にコンパクト化

---

### 2-3. デザイントーンの変更

**現状の問題**:
- グラスモーフィズムがカジュアルすぎる
- 絵文字アイコンがビジネス感を損なう

**変更内容**:
- `backdrop-filter: blur()` を削除または軽減
- 絵文字を最小限に（🚀, ⚙️ などセクションタイトルのみ残す）
- カラーパレットを落ち着いたトーンに調整

---

## 変更対象ファイル

### [MODIFY] `src/index.html`

1. Timeline Configuration セクションを削除
2. Timeline 選択をヘッダーに移動
3. 絵文字の削減

### [MODIFY] `src/style.css`

1. `.glass-card` のパディングを縮小
2. `backdrop-filter` の軽減
3. マージンの調整
4. カラー変数の調整

### [MODIFY] `src/ui.js`

1. Anchor 表示を Phase 行内に統合
2. 不要になった `renderAnchorSelect()` の整理

### [MODIFY] `src/main.js`

1. 削除されたDOM要素への参照を削除
2. イベントリスナーの整理

---

## 検証方法

1. ブラウザで確認（HTTP server経由）
2. 全機能が動作することを確認
3. デザインがビジネスライクになったことを視覚的に確認

---

> **次のアクション**: この計画書の承認後、実装を開始します。
