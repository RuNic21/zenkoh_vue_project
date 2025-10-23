# Constants 리팩토링 가이드

## 📋 개요

프로젝트 전체에서 반복되는 상수값들을 `src/constants/` 디렉토리로 통합하여 코드 중복을 제거하고 유지보수성을 향상시켰습니다.

## 🗂️ 새로 생성된 Constants 파일

### 1. `pagination.ts` - 페이지네이션/테이블 설정

```typescript
// 기본 페이지 크기
export const DEFAULT_PAGE_SIZE = 10;

// 선택 가능한 페이지 크기 옵션
export const TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

// 테이블 자동 갱신 간격
export const TABLE_REFRESH_INTERVAL_MS = 10000; // 10초
```

**사용 위치:**
- `src/composables/useProjectManagement.ts`
- `src/pages/ProjectDetail.vue`
- `src/components/table/OptimizedDataTable.vue`

---

### 2. `format.ts` - 날짜/시간 포맷 설정

```typescript
// 날짜 포맷
export const DATE_FORMAT = "YYYY-MM-DD" as const;
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss" as const;
export const TIME_FORMAT = "HH:mm" as const;

// 로케일 설정
export const LOCALE = "ja-JP" as const;
export const DEFAULT_TIMEZONE = "Asia/Tokyo" as const;
export const DEFAULT_LANGUAGE = "ja" as const;

// 기본 근무 시간
export const DEFAULT_WORK_HOURS = {
  start: "09:00",
  end: "18:00"
} as const;

// 정규 표현식 패턴
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
```

**사용 위치:**
- `src/utils/formatters.ts`
- `src/utils/dateUtils.ts`

---

### 3. `messages.ts` - 공통 메시지 정의

```typescript
// 성공 메시지
export const SUCCESS_MESSAGES = {
  CREATE: "正常に作成されました",
  UPDATE: "正常に更新されました",
  DELETE: "正常に削除されました",
  
  PROJECT_CREATE: "プロジェクトが正常に作成されました",
  PROJECT_UPDATE: "プロジェクトが正常に更新されました",
  PROJECT_DELETE: "プロジェクトが正常に削除されました",
  
  TASK_CREATE: "タスクが正常に作成されました",
  // ... 기타 메시지
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  GENERIC: "エラーが発生しました",
  LOAD_FAILED: "読み込みに失敗しました",
  
  PROJECT_LOAD_FAILED: "プロジェクトの読み込みに失敗しました",
  PROJECT_CREATE_FAILED: "プロジェクトの作成に失敗しました",
  
  REQUIRED_FIELD: "必須項目を入力してください",
  SELECT_PROJECT: "プロジェクトを選択してください",
  // ... 기타 메시지
} as const;

// 확인 메시지
export const CONFIRM_MESSAGES = {
  DELETE: "本当に削除しますか？",
  DELETE_PROJECT: "このプロジェクトを削除しますか？関連するタスクも削除されます。",
  // ... 기타 메시지
} as const;
```

**사용 위치:**
- `src/composables/useProjectManagement.ts`
- `src/composables/useNotificationsManagement.ts`
- `src/composables/useTeamManagement.ts`

---

### 4. `database.ts` - 데이터베이스 쿼리 설정

```typescript
// 쿼리 정렬 순서
export const QUERY_ORDER = {
  CREATED_DESC: { column: "created_at", ascending: false },
  CREATED_ASC: { column: "created_at", ascending: true },
  UPDATED_DESC: { column: "updated_at", ascending: false },
  UPDATED_ASC: { column: "updated_at", ascending: true },
  NAME_ASC: { column: "name", ascending: true },
  DISPLAY_NAME_ASC: { column: "display_name", ascending: true },
} as const;

// 쿼리 제한
export const DEFAULT_LIMIT = 100;
export const MAX_QUERY_LIMIT = 1000;
export const QUERY_TIMEOUT_MS = 30000; // 30초

// 재시도 설정
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  BACKOFF_MULTIPLIER: 2,
} as const;
```

**사용 예정 위치:**
- `src/services/*.ts` (향후 적용 가능)

---

### 5. `validation.ts` - 검증 규칙/입력 제한

```typescript
// 검증 패턴
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10,11}$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  // ... 기타 패턴
} as const;

// 입력 문자 수 제한
export const INPUT_LIMITS = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TEXT_LENGTH: 1000,
  TRUNCATE_LENGTH: 50,
  // ... 기타 제한
} as const;

// 사용자 우선도 계산 임계값
export const USER_PRIORITY_THRESHOLDS = {
  URGENT: { minLoginCount: 50, maxDaysSinceLogin: 7 },
  HIGH: { minLoginCount: 20, maxDaysSinceLogin: 30 },
  MEDIUM: { minLoginCount: 5, maxDaysSinceLogin: Infinity },
  LOW: { minLoginCount: 0, maxDaysSinceLogin: Infinity },
} as const;

// Alert Rule 기본값
export const ALERT_RULE_DEFAULTS = {
  days_before: 3,
  days_overdue: 1,
  days_no_progress: 7,
  min_progress_percent: 0,
  target_status: "IN_PROGRESS" as const,
} as const;
```

**사용 위치:**
- `src/utils/formatters.ts` (USER_PRIORITY_THRESHOLDS, INPUT_LIMITS)
- `src/components/notification/AlertRuleModal.vue` (ALERT_RULE_DEFAULTS)
- 향후 폼 검증에 활용 가능

---

## 🔄 확장된 기존 Constants 파일

### 6. `ui.ts` - UI 관련 상수 (확장됨)

**기존 내용:**
- `STATUS_LABELS`, `PRIORITY_LABELS`, `BADGE_COLORS`
- `TASK_STATUS_OPTIONS`, `TASK_PRIORITY_OPTIONS`
- `ALERT_RULE_TYPE_OPTIONS`, `ALERT_TARGET_STATUS_OPTIONS`

**추가된 내용:**

```typescript
// 메시지 표시 기간
export const MESSAGE_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  PERMANENT: 0,
} as const;

// 캐시 TTL
export const CACHE_TTL = {
  SHORT: 60000,      // 1분
  MEDIUM: 300000,    // 5분
  LONG: 3600000,     // 1시간
  VERY_LONG: 86400000, // 24시간
} as const;

// Z-Index
export const Z_INDEX = {
  MODAL: 10000,
  TOAST: 9999,
  DROPDOWN: 1000,
  OVERLAY: 999,
  HEADER: 100,
} as const;

// 필터 기본값 및 옵션
export const FILTER_ALL = "all" as const;
export const USER_STATUS_FILTERS = [...];
export const NOTIFICATION_STATUS_FILTERS = [...];
export const TEAM_ROLE_FILTERS = [...];
export const PROJECT_STATUS_FILTERS = [...];
```

**사용 위치:**
- `src/composables/useMessage.ts` (MESSAGE_DURATION)
- 향후 필터 컴포넌트에서 활용 가능

---

### 7. `chart.ts` - 차트/색상 (확장 및 통합됨)

**기존 내용:**
- `CHART_COLORS`, `STATUS_COLORS`

**확장된 내용:**

```typescript
// 테마 색상 (통합)
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

// CHART_COLORS는 이제 THEME_COLORS의 별칭
export const CHART_COLORS = THEME_COLORS;

// 상태별 색상
export const STATUS_COLORS = {
  完了: THEME_COLORS.success,
  進行中: THEME_COLORS.primary,
  遅延: THEME_COLORS.danger,
  未開始: THEME_COLORS.secondary,
  保留: THEME_COLORS.warning,
  ブロック: THEME_COLORS.warning,
  キャンセル: THEME_COLORS.secondary,
} as const;

// 우선도별 색상
export const PRIORITY_COLORS = {
  URGENT: THEME_COLORS.danger,
  HIGH: "#fd7e14",
  MEDIUM: THEME_COLORS.warning,
  LOW: THEME_COLORS.success,
} as const;

// 기한별 색상
export const DEADLINE_COLORS = {
  今週: THEME_COLORS.success,
  来週: THEME_COLORS.primary,
  今月: THEME_COLORS.warning,
  期限切れ: THEME_COLORS.danger,
  その他: THEME_COLORS.secondary,
} as const;

// 차트용 팔레트
export const CHART_PALETTE = [
  THEME_COLORS.primary,
  THEME_COLORS.success,
  THEME_COLORS.warning,
  THEME_COLORS.danger,
  THEME_COLORS.info,
  THEME_COLORS.secondary,
  "#fd7e14", // 오렌지
  "#20c997", // 틸
  "#6610f2", // 인디고
  "#e83e8c", // 핑크
] as const;
```

**변경사항:**
- `src/utils/chartColors.ts`는 이제 `src/constants/chart.ts`를 재export하는 래퍼로 변경 (후방 호환성)
- `chartColors.ts`는 deprecated 표시

---

## ✅ 적용된 파일 목록

### Composables
- ✅ `src/composables/useProjectManagement.ts`
  - DEFAULT_PAGE_SIZE, SUCCESS_MESSAGES, ERROR_MESSAGES 사용
- ✅ `src/composables/useNotificationsManagement.ts`
  - ERROR_MESSAGES 사용
- ✅ `src/composables/useTeamManagement.ts`
  - ERROR_MESSAGES 사용
- ✅ `src/composables/useMessage.ts`
  - MESSAGE_DURATION 사용

### Utils
- ✅ `src/utils/formatters.ts`
  - LOCALE, INPUT_LIMITS, USER_PRIORITY_THRESHOLDS 사용
- ✅ `src/utils/dateUtils.ts`
  - DATE_PATTERN 사용
- ✅ `src/utils/chartColors.ts`
  - chart.ts 재export로 변경 (deprecated)

### Components
- ✅ `src/components/table/OptimizedDataTable.vue`
  - DEFAULT_PAGE_SIZE, TABLE_REFRESH_INTERVAL_MS 사용
- ✅ `src/components/notification/AlertRuleModal.vue`
  - ALERT_RULE_DEFAULTS 사용

### Pages
- ✅ `src/pages/ProjectDetail.vue`
  - DEFAULT_PAGE_SIZE 사용

---

## 📊 효과

### Before (개선 전)

```typescript
// 여러 파일에 중복된 하드코딩 값들
const pageSize = ref(10);  // ProjectManagement.vue
const pageSize = ref(10);  // ProjectDetail.vue
const pageSize: 50,        // OptimizedDataTable.vue

showError("プロジェクトの作成に失敗しました");  // useProjectManagement.ts
showError("通知の作成に失敗しました");           // useNotificationsManagement.ts

const duration = 5000;  // useMessage.ts
```

### After (개선 후)

```typescript
// constants에서 import하여 일관성 유지
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
const pageSize = ref(DEFAULT_PAGE_SIZE);

import { ERROR_MESSAGES } from "@/constants/messages";
showError(ERROR_MESSAGES.PROJECT_CREATE_FAILED);
showError(ERROR_MESSAGES.NOTIFICATION_CREATE_FAILED);

import { MESSAGE_DURATION } from "@/constants/ui";
const duration = MESSAGE_DURATION.MEDIUM;
```

### 장점

1. **일관성 향상**: 모든 파일에서 동일한 값 사용
2. **유지보수 용이**: 한 곳만 수정하면 전체 반영
3. **타입 안전성**: `as const`로 리터럴 타입 보장
4. **가독성 향상**: 의미 있는 상수명 사용
5. **중복 제거**: DRY 원칙 준수

---

## 🔮 향후 적용 가능 영역

### 1. Services Layer
- `database.ts`의 QUERY_ORDER를 services에 적용
- 통일된 쿼리 패턴 사용

### 2. Form Validation
- `validation.ts`의 VALIDATION_PATTERNS를 폼 검증에 활용
- 입력 제한값 통일

### 3. Filter Components
- `ui.ts`의 필터 옵션들을 필터 컴포넌트에 적용
- 일관된 필터 UI 제공

### 4. 추가 메시지
- 더 많은 성공/에러 메시지를 `messages.ts`에 추가
- 사용자 경험 개선

---

## 📝 사용 가이드

### 새로운 상수 추가 시

1. 적절한 파일 선택 (또는 새 파일 생성)
2. `as const`로 타입 안전성 보장
3. JSDoc 코멘트로 용도 설명
4. export하여 다른 파일에서 사용 가능하게

### 예시

```typescript
// src/constants/ui.ts에 추가
/**
 * 모달 크기 옵션
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

## 🎯 결론

이번 리팩토링으로 프로젝트의 상수 관리가 체계화되었습니다. 향후 개발 시 constants를 우선 확인하고, 없는 경우 추가하여 일관성을 유지하시기 바랍니다.

