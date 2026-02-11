# Phase 15: 設定パネルのレイアウト改善

## 目的
設定パネル (`#global-settings-panel`) のレイアウトを整理し、環境設定（祝日・プリセット）と個別設定（スケジュール・タグ）を明確に分離する。
また、ヘッダー上の「Save」「Load」ボタンをパネル内に移動し、操作動線を設定パネル内に集約する。

## 変更概要

### 1. `index.html`
- ヘッダー (`.header-actions`) から `save-btn` と `load-btn` を削除し、設定パネル内に移動。
- 設定パネルの構造を `display: grid` を用いた2段構成に変更。

```html
<div class="settings-container">
  <!-- Section 1: 環境設定 (Environment) -->
  <section class="settings-group env-settings">
    <header>
      <h3>環境Settings</h3>
      <div class="actions">
        <!-- Settings Export/Import -->
        <button id="export-settings-btn">Save (Env)</button>
        <button id="import-settings-btn">Load (Env)</button>
      </div>
    </header>
    <div class="grid-2-col">
      <div class="col-holidays">...</div>
      <div class="col-presets">...</div>
    </div>
  </section>

  <hr class="settings-divider">

  <!-- Section 2: 個別設定 (Project) -->
  <section class="settings-group proj-settings">
    <header>
      <h3>個別Settings</h3>
      <div class="actions">
        <!-- Project Save/Load (Moved from Header) -->
        <button id="save-btn">Save (Project)</button>
        <button id="load-btn">Load (Project)</button>
      </div>
    </header>
    <div class="col-tags">...</div>
  </section>
</div>
```

### 2. `style.css`
- パネル幅の調整 (`max-width` の見直し、または `width: fit-content` 等)
- セクション間の境界線 (`border-bottom` or `hr`)
- グリッドレイアウト定義

## 影響範囲
- UIのみの変更。ロジック変更なし。
- `main.js` のイベントリスナーはID指定のため、HTML構造変更後も動作するはずだが確認が必要。

---

## ドキュメント番号の意味

- ファイル名先頭の番号は推奨読込順を表します。
- 数字が小さいほど先に読む運用です。
- `90`番台は評価・方針などの参照資料です。
