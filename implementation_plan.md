# 並行工程の営業日考慮 (Parallel Phase Business Days)

## Goal Description
並行工程（Parallel Phase）の日数計算において、現在は単純な「暦日（カレンダー通りの日数）」の差分を計算しているため、土日祝日が含まれてしまい、実際の「営業日」数と乖離が生じる問題を修正する。
具体的には、開始日と終了日の間の営業日のみをカウントするロジックを導入する。

## User Review Required
> [!NOTE]
> この変更により、既存の並行工程の日数が減る可能性があります（土日祝が含まれていた分が除外されるため）。

## Proposed Changes

### [dateUtils.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/dateUtils.js)
#### [MODIFY] dateUtils.js
- `getBusinessDaysDiff(startDate, endDate)` 関数を追加
    - 開始日と終了日の間の営業日数をカウントする
    - `isWorkingDay` を利用して判定

### [scheduler.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/scheduler.js)
#### [MODIFY] scheduler.js
- `processParallel` 関数内の `getDaysDiff` 呼び出しを `getBusinessDaysDiff` に変更

## Verification Plan

### Automated Tests
- なし（現状のテストフレームワークがないため）

### Manual Verification
1. `http://localhost:8080/src/` を開く
2. 新規フェーズを作成し、「並行」チェックを入れる
3. 開始日を金曜日、終了日を翌週月曜日に設定（土日を挟む）
    - **Before**: 4日間と表示される（金・土・日・月）
    - **After**: 2日間と表示される（金・月）
4. 祝日を含む期間でテストを行い、祝日が除外されることを確認
