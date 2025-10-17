# TeamManagement 남은 테스크 (Notifications / Alert Rules)

본 문서는 TeamManagement 페이지 리팩터링 이후 남은 필수/권장 작업을 정리합니다. 현재 상태: 멤버/프로젝트팀 composable 연결, 알림/룰 테이블·모달 컴포넌트화 완료.

## 반드시 진행 (Must-have)
- 알림 편집 트리거 연결
  - NotificationTable에서 편집 트리거(행 클릭 또는 별도 버튼) → `openEditNotificationModal(notification)` 호출.
  - 현재는 생성/재전송/삭제만 연결됨.

- 알림 수정 저장 처리 안정화
  - `onSaveNotification(form)`에서 편집분기 시 `updateNotificationAction` 호출 후 `loadNotifications`/`loadNotificationStats` 재로딩 유지.
  - 실패 케이스 메시지/예외 처리 정리.

- 룰 편집 저장 핸들러 분리 및 연결
  - `AlertRuleModal` 저장 이벤트를 `onSaveAlertRule(form)`으로 분리: 생성/수정 분기 처리 + `loadAlertRules` 재로딩.
  - 현재 인라인 람다에서 처리 중인 부분을 함수로 이동하여 가독성/테스트성 향상.

- 룰 선택 연동
  - `AlertRuleTable`에 선택/전체선택 props(`selectedIds`)와 이벤트(`select`, `selectAll`) 추가.
  - 페이지의 `selectedAlertRules` 상태와 양방향 연결(일괄 삭제/활성화 등에 사용).

## 권장 개선 (Nice-to-have)
- 알림 모달 필드 범위 정의
  - `NotificationModal`에 `project_id`/`task_id`/`send_after` 편집을 포함할지, 혹은 별도 상세 편집 모달로 분리할지 결정.

- 입력 검증/에러 UX 통일
  - 이메일 형식/필수값 검증 추가.
  - `src/utils/errorHandler.ts` 기반의 일관된 에러 처리와 토스트 알림 도입.

- 목록 성능 최적화
  - 알림/룰 목록에 페이지네이션 또는 가상 스크롤 적용.
  - 대량 선택 시 연산 최소화(집계/렌더링 배치).

- 테스트 보완
  - composable 액션 유닛 테스트(성공/실패/예외 케이스).
  - NotificationTable/AlertRuleTable 렌더 및 이벤트 e2e 테스트.

## 관련 경로/식별자 참고
- 페이지: `src/pages/TeamManagement.vue`
- 알림: `useNotificationsManagement` / `NotificationTable.vue` / `NotificationModal.vue`
- 룰: `AlertRuleTable.vue` / `AlertRuleModal.vue`
- 현재 편집 저장 핸들러
  - 알림: `onSaveNotification(form)`
  - 룰: (분리 예정) `onSaveAlertRule(form)` ← 신규 함수로 추출 권장

## 작업 메모
- 선택 연동 구현 시, Set<number> ↔ 배열 변환 주의(`Array.from(selectedXxx)`).
- 타입 안전성 유지: 상태/라벨 매핑은 구체적 타입 키(`NotificationStatus` 등)로 인덱싱.
- 저장 성공 후에는 반드시 목록/통계 재로딩 및 모달 닫기 흐름 유지.


