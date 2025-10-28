# Constants リファクタリングガイド

## 📋 概要

プロジェクト全体で繰り返される定数値を `src/constants/` ディレクトリに統合し、コードの重複を削減してメンテナンス性を向上させました。

## 🗂️ 新規作成された Constants ファイル

### 1. `pagination.ts` - ページネーション/テーブル設定

```typescript
// デフォルトページサイズ
export const DEFAULT_PAGE_SIZE = 10;

// 選択可能なページサイズオプション
export const TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

// テーブル自動更新間隔
export const TABLE_REFRESH_INTERVAL_MS = 10000; // 10秒
```

**使用箇所:**
- `src/composables/useProjectManagement.ts`
- `src/pages/ProjectDetail.vue`
- `src/components/table/OptimizedDataTable.vue`

---

### 2. `format.ts` - 日付/時刻フォーマット設定

```typescript
// 日付フォーマット
export const DATE_FORMAT = "YYYY-MM-DD" as const;
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss" as const;
export const TIME_FORMAT = "HH:mm" as const;

// ロケール設定
export const LOCALE = "ja-JP" as const;
export const DEFAULT_TIMEZONE = "Asia/Tokyo" as const;
export const DEFAULT_LANGUAGE = "ja" as const;

// デフォルト勤務時間
export const DEFAULT_WORK_HOURS = {
  start: "09:00",
  end: "18:00"
} as const;

// 正規表現パターン
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
```

**使用箇所:**
- `src/utils/formatters.ts`
- `src/utils/dateUtils.ts`

---

### 3. `messages.ts` - 共通メッセージ定義

```typescript
// 成功メッセージ
export const SUCCESS_MESSAGES = {
  CREATE: "正常に作成されました",
  UPDATE: "正常に更新されました",
  DELETE: "正常に削除されました",
  
  PROJECT_CREATE: "プロジェクトが正常に作成されました",
  PROJECT_UPDATE: "プロジェクトが正常に更新されました",
  PROJECT_DELETE: "プロジェクトが正常に削除されました",
  
  TASK_CREATE: "タスクが正常に作成されました",
  // ... その他のメッセージ
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  GENERIC: "エラーが発生しました",
  LOAD_FAILED: "読み込みに失敗しました",
  
  PROJECT_LOAD_FAILED: "プロジェクトの読み込みに失敗しました",
  PROJECT_CREATE_FAILED: "プロジェクトの作成に失敗しました",
  
  REQUIRED_FIELD: "必須項目を入力してください",
  SELECT_PROJECT: "プロジェクトを選択してください",
  // ... その他のメッセージ
} as const;

// 確認メッセージ
export const CONFIRM_MESSAGES = {
  DELETE: "本当に削除しますか？",
  DELETE_PROJECT: "このプロジェクトを削除しますか？関連するタスクも削除されます。",
  // ... その他のメッセージ
} as const;
```

**使用箇所:**
- `src/composables/useProjectManagement.ts`
- `src/composables/useNotificationsManagement.ts`
- `src/composables/useTeamManagement.ts`

---

### 4. `database.ts` - データベースクエリ設定

```typescript
// クエリ並び順
export const QUERY_ORDER = {
  CREATED_DESC: { column: "created_at", ascending: false },
  CREATED_ASC: { column: "created_at", ascending: true },
  UPDATED_DESC: { column: "updated_at", ascending: false },
  UPDATED_ASC: { column: "updated_at", ascending: true },
  NAME_ASC: { column: "name", ascending: true },
  DISPLAY_NAME_ASC: { column: "display_name", ascending: true },
} as const;

// クエリ制限
export const DEFAULT_LIMIT = 100;
export const MAX_QUERY_LIMIT = 1000;
export const QUERY_TIMEOUT_MS = 30000; // 30秒

// リトライ設定
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  BACKOFF_MULTIPLIER: 2,
} as const;
```

**今後の適用予定:**
- `src/services/*.ts` (今後適用可能)

---

### 5. `validation.ts` - 検証ルール/入力制限

```typescript
// 検証パターン
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10,11}$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  // ... その他のパターン
} as const;

// 入力文字数制限
export const INPUT_LIMITS = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TEXT_LENGTH: 1000,
  TRUNCATE_LENGTH: 50,
  // ... その他の制限
} as const;

// ユーザー優先度計算しきい値
export const USER_PRIORITY_THRESHOLDS = {
  URGENT: { minLoginCount: 50, maxDaysSinceLogin: 7 },
  HIGH: { minLoginCount: 20, maxDaysSinceLogin: 30 },
  MEDIUM: { minLoginCount: 5, maxDaysSinceLogin: Infinity },
  LOW: { minLoginCount: 0, maxDaysSinceLogin: Infinity },
} as const;

// Alert Rule デフォルト値
export const ALERT_RULE_DEFAULTS = {
  days_before: 3,
  days_overdue: 1,
  days_no_progress: 7,
  min_progress_percent: 0,
  target_status: "IN_PROGRESS" as const,
} as const;
```

**使用箇所:**
- `src/utils/formatters.ts` (USER_PRIORITY_THRESHOLDS, INPUT_LIMITS)
- `src/components/notification/AlertRuleModal.vue` (ALERT_RULE_DEFAULTS)
- 今後のフォーム検証に活用可能

---

## 🔄 拡張された既存 Constants ファイル

### 6. `ui.ts` - UI 関連定数（拡張済み）

**既存の内容:**
- `STATUS_LABELS`, `PRIORITY_LABELS`, `BADGE_COLORS`
- `TASK_STATUS_OPTIONS`, `TASK_PRIORITY_OPTIONS`
- `ALERT_RULE_TYPE_OPTIONS`, `ALERT_TARGET_STATUS_OPTIONS`

**追加された内容:**

```typescript
// メッセージ表示期間
export const MESSAGE_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  PERMANENT: 0,
} as const;

// キャッシュ TTL
export const CACHE_TTL = {
  SHORT: 60000,      // 1分
  MEDIUM: 300000,    // 5分
  LONG: 3600000,     // 1時間
  VERY_LONG: 86400000, // 24時間
} as const;

// Z-Index
export const Z_INDEX = {
  MODAL: 10000,
  TOAST: 9999,
  DROPDOWN: 1000,
  OVERLAY: 999,
  HEADER: 100,
} as const;

// フィルターデフォルト値およびオプション
export const FILTER_ALL = "all" as const;
export const USER_STATUS_FILTERS = [...];
export const NOTIFICATION_STATUS_FILTERS = [...];
export const TEAM_ROLE_FILTERS = [...];
export const PROJECT_STATUS_FILTERS = [...];
```

**使用箇所:**
- `src/composables/useMessage.ts` (MESSAGE_DURATION)
- 今後のフィルターコンポーネントで活用可能

---

### 7. `chart.ts` - チャート/色（拡張および統合済み）

**既存の内容:**
- `CHART_COLORS`, `STATUS_COLORS`

**拡張された内容:**

```typescript
// テーマ色（統合）
export const THEME_COLORS = {
  primary: "#007bff",
  success: "#28a745",
  info: "#17a2b8",
  warning: "#ffc107",
  danger: "#dc3545",
  secondary: "#6c757d",
  light: "#f8f9fa",
  dark: "#343a40",
} as const;

// CHART_COLORS は THEME_COLORS のエイリアス
export const CHART_COLORS = THEME_COLORS;

// ステータス別色
export const STATUS_COLORS = {
  完了: THEME_COLORS.success,
  進行中: THEME_COLORS.primary,
  遅延: THEME_COLORS.danger,
  未開始: THEME_COLORS.secondary,
  保留: THEME_COLORS.warning,
  ブロック: THEME_COLORS.warning,
  キャンセル: THEME_COLORS.secondary,
} as const;

// 優先度別色
export const PRIORITY_COLORS = {
  URGENT: THEME_COLORS.danger,
  HIGH: "#fd7e14",
  MEDIUM: THEME_COLORS.warning,
  LOW: THEME_COLORS.success,
} as const;

// 期限別色
export const DEADLINE_COLORS = {
  今週: THEME_COLORS.success,
  来週: THEME_COLORS.primary,
  今月: THEME_COLORS.warning,
  期限切れ: THEME_COLORS.danger,
  その他: THEME_COLORS.secondary,
} as const;

// チャート用パレット
export const CHART_PALETTE = [
  THEME_COLORS.primary,
  THEME_COLORS.success,
  THEME_COLORS.warning,
  THEME_COLORS.danger,
  THEME_COLORS.info,
  THEME_COLORS.secondary,
  "#fd7e14", // オレンジ
  "#20c997", // ティール
  "#6610f2", // インディゴ
  "#e83e8c", // ピンク
] as const;
```

**変更事項:**
- `src/utils/chartColors.ts` は `src/constants/chart.ts` を再エクスポートするラッパーに変更（後方互換性）
- `chartColors.ts` は非推奨として表示

---

## ✅ 適用されたファイル一覧

### Composables
- ✅ `src/composables/useProjectManagement.ts`
  - DEFAULT_PAGE_SIZE, SUCCESS_MESSAGES, ERROR_MESSAGES 使用
- ✅ `src/composables/useNotificationsManagement.ts`
  - ERROR_MESSAGES 使用
- ✅ `src/composables/useTeamManagement.ts`
  - ERROR_MESSAGES 使用
- ✅ `src/composables/useMessage.ts`
  - MESSAGE_DURATION 使用

### Utils
- ✅ `src/utils/formatters.ts`
  - LOCALE, INPUT_LIMITS, USER_PRIORITY_THRESHOLDS 使用
- ✅ `src/utils/dateUtils.ts`
  - DATE_PATTERN 使用
- ✅ `src/utils/chartColors.ts`
  - chart.ts 再エクスポートに変更（非推奨）

### Components
- ✅ `src/components/table/OptimizedDataTable.vue`
  - DEFAULT_PAGE_SIZE, TABLE_REFRESH_INTERVAL_MS 使用
- ✅ `src/components/notification/AlertRuleModal.vue`
  - ALERT_RULE_DEFAULTS 使用

### Pages
- ✅ `src/pages/ProjectDetail.vue`
  - DEFAULT_PAGE_SIZE 使用

---

## 📊 効果

### Before（改善前）

```typescript
// 複数のファイルに重複したハードコーディング値
const pageSize = ref(10);  // ProjectManagement.vue
const pageSize = ref(10);  // ProjectDetail.vue
const pageSize: 50,        // OptimizedDataTable.vue

showError("プロジェクトの作成に失敗しました");  // useProjectManagement.ts
showError("通知の作成に失敗しました");           // useNotificationsManagement.ts

const duration = 5000;  // useMessage.ts
```

### After（改善後）

```typescript
// constants からインポートして一貫性を維持
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
const pageSize = ref(DEFAULT_PAGE_SIZE);

import { ERROR_MESSAGES } from "@/constants/messages";
showError(ERROR_MESSAGES.PROJECT_CREATE_FAILED);
showError(ERROR_MESSAGES.NOTIFICATION_CREATE_FAILED);

import { MESSAGE_DURATION } from "@/constants/ui";
const duration = MESSAGE_DURATION.MEDIUM;
```

### メリット

1. **一貫性の向上**: すべてのファイルで同じ値を使用
2. **メンテナンス容易**: 一箇所の修正で全体に反映
3. **型安全性**: `as const` でリテラル型を保証
4. **可読性向上**: 意味のある定数名を使用
5. **重複削減**: DRY 原則の遵守

---

## 🔮 今後の適用可能領域

### 1. Services Layer
- `database.ts` の QUERY_ORDER を services に適用
- 統一されたクエリパターンの使用

### 2. Form Validation
- `validation.ts` の VALIDATION_PATTERNS をフォーム検証に活用
- 入力制限値の統一

### 3. Filter Components
- `ui.ts` のフィルターオプションをフィルターコンポーネントに適用
- 一貫したフィルター UI の提供

### 4. 追加メッセージ
- より多くの成功/エラーメッセージを `messages.ts` に追加
- ユーザー体験の向上

---

## 📝 使用ガイド

### 新しい定数を追加する場合

1. 適切なファイルを選択（または新しいファイルを作成）
2. `as const` で型安全性を保証
3. JSDoc コメントで用途を説明
4. export して他のファイルで使用可能にする

### 例

```typescript
// src/constants/ui.ts に追加
/**
 * モーダルサイズオプション
 */
export const MODAL_SIZES = {
  SMALL: "sm",
  MEDIUM: "md",
  LARGE: "lg",
  EXTRA_LARGE: "xl",
} as const;

export type ModalSize = typeof MODAL_SIZES[keyof typeof MODAL_SIZES];
```

---

## 🎯 結論

今回のリファクタリングにより、プロジェクトの定数管理が体系化されました。今後の開発時は constants を優先的に確認し、ない場合は追加して一貫性を維持してください。
