# Phase 3 実装計画書: 機能強化

<!-- Approved -->
> **Approved by**: wakaumekenji
> **Date**: 2026-02-08 02:07
> **Phase**: Implementation Plan

**作成日**: 2026-02-08
**ブランチ**: `feature/phase3-enhancements`

---

## 目的

ユーザビリティ向上のため、Undo/Redo機能とキーボードショートカットを追加する。

---

## 3-1. Undo/Redo 機能

### 設計
- **履歴スタック**: 状態のスナップショットを配列で保持
- **最大履歴数**: 50件（メモリ節約）
- **対象操作**: フェーズ追加/削除/編集、アンカー変更、日数変更

### ファイル変更

#### [NEW] `src/history.js`
- `pushHistory(state)` - 履歴追加
- `undo()` / `redo()` - 復元
- `canUndo()` / `canRedo()` - 状態確認

#### [MODIFY] `src/main.js`
- 状態変更時に `pushHistory()` を呼び出し
- Undo/Redoイベントリスナー追加

#### [MODIFY] `src/index.html`
- Undo/Redoボタン追加（ヘッダー）

---

## 3-2. キーボードショートカット

| ショートカット | アクション |
|:---|:---|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + N` | 新規フェーズ追加 |

### ファイル変更

#### [MODIFY] `src/main.js`
- `keydown` イベントリスナー追加
- ショートカットハンドラー実装

---

## 検証方法

1. フェーズ編集後、Ctrl+Z でUndo
2. Ctrl+Shift+Z でRedo
3. Ctrl+N で新規フェーズ追加
4. 履歴上限(50件)の動作確認

---

> **次のアクション**: この計画書の承認後、実装を開始します。
