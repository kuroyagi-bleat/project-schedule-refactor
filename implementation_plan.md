# Chrome拡張機能化 (Phase 6) 実装計画

## 目標
現在のWebアプリケーションをChrome拡張機能としてパッケージ化し、ブラウザのツールバーからワンクリックで全画面表示（新規タブ）できるようにする。

## 方針
- **Manifest V3** 準拠
- `src` ディレクトリを拡張機能のルートディレクトリとして利用
- **Action起動**: アイコンクリック時に `index.html` を新規タブで開く

## 変更内容

### 1. [NEW] `src/manifest.json`
拡張機能の定義ファイル。
- `manifest_version`: 3
- `name`: "Project Schedule Refactor" (仮)
- `version`: "1.0.0"
- `action`: クリックイベントをフックするため空設定、またはデフォルトポップアップなし
- `background`: Service Worker (`background.js`)

### 2. [NEW] `src/background.js`
アイコンクリックイベントを監視し、タブを開く。
```javascript
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: "index.html"
  });
});
```

### 3. [NEW] `src/icons/`
アイコン画像（16, 48, 128px）。

## 留意点
- **データ保存場所**: `localStorage` は `chrome-extension://[ID]/` ドメイン下に保存されます。現在の `localhost` のデータは引き継がれません（手動エクスポート/インポートが必要）。
- **CSP (Content Security Policy)**: 外部スクリプト（CDN等）は原則禁止ですが、現在はローカルファイルのみで構成されているため問題ありません。

## 検証方法
1. Chromeの `chrome://extensions` を開く
2. 「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」で `src` ディレクトリを選択
4. アイコンが表示されるか、クリックしてアプリが開くか確認
