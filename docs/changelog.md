# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Phase 3: 機能強化**
  - Undo/Redo機能（`history.js`モジュール新規作成）
  - キーボードショートカット（Cmd/Ctrl+Z/Y/S/N）
  - Undo/Redoボタンをヘッダーに追加

### Fixed
- ESM参照問題を`Object.assign`使用で修正

## [1.0.0] - 2026-02-08

### Added
- **Phase 1: コード基盤整備**
  - `script.js` を7つのES Modulesに分割 (config, dateUtils, state, scheduler, ui, gantt, main)
  - XSSエスケープ機能を `ui.js` に追加

- **Phase 2: UI/UXリデザイン**
  - Timeline選択をヘッダーに統合
  - マージン縮小 (`2rem` → `1rem`)
  - Glassmorphism → Flatデザインに変更
  - Anchor設定をPhase Stepsに統合（開始/完了ラジオボタン追加）

### Changed
- Anchor Barを日付入力のみに簡素化

### Removed
- 冗長なAnchor工程選択ドロップダウン
