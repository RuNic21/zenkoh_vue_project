# TODO - 공통화 및 리팩터링 진행 메모

## 완료된 항목
- [x] PageHeader, CardHeader 도입 및 `ReportPage.vue`, `ProjectManagement.vue` 적용
- [x] ActionBar 도입 및 `ReportPage.vue`, `ProjectManagement.vue` 적용
- [x] StatCards 도입 및 두 페이지 요약 카드 교체
- [x] TablePagination 분리, 두 테이블(`PerformanceOptimizedTable`, `OptimizedDataTable`) 적용
- [x] TableControls 추가(검색/셀렉트/리셋), `ProjectManagement.vue` 연결
- [x] StatusBadge, PriorityBadge 도입 및 테이블/상세에 적용
- [x] ModalShell 도입 및 `ProjectManagement.vue` 생성/편집/삭제 모달 교체
- [x] exportUtils(toCsv, downloadFile) 도입 및 Report CSV 내보내기 교체
- [x] formatters(formatDateJP 등) 도입 및 적용
- [x] chartOptions, constants/chart, constants/ui, tableUtils 추가
- [x] `ScheduleList.vue`에 PageHeader, ActionBar, StatusBadge, PriorityBadge 적용
- [x] `ScheduleDetail.vue`에 PageHeader, StatusBadge, PriorityBadge 적용
- [x] `ReportChart.vue`에 chartOptions 적용(内部オプション集約)
- [x] StatusBadge, PriorityBadge에 constants/ui 활용하여 라벨 일원화
- [x] `TeamManagement.vue`에 PageHeader, StatCards, ActionBar, StatusBadge, ModalShell 적용

## 다음에 진행할 후보
- [x] TeamManagement.vue에 공통 컴포넌트 적용 정리 (완료)
  - [x] PageHeader, StatCards 적용 완료
  - [x] ActionBar, StatusBadge 적용 완료
  - [x] ModalShell 적용 완료
- [ ] 접근성(A11y) 개선: 배지/페이지네이션/로딩 aria-속성 보강
- [ ] 단위 테스트: TableControls, Pagination, Badge, exportUtils, formatters
- [ ] Storybook/문서 초안: common/*, table/* 컴포넌트 사용 예시 정리

## 메모
- 🎉 모든 핵심 페이지(Report, ProjectManagement, ScheduleList, ScheduleDetail, TeamManagement)의 공통화 반영 완료 및 린트 통과 상태입니다.
- TeamManagement.vue에 PageHeader, StatCards, ActionBar, StatusBadge, ModalShell 적용 완료
- ScheduleList.vue와 ScheduleDetail.vue에 PageHeader, ActionBar, StatusBadge, PriorityBadge 적용 완료
- ReportChart.vue에 chartOptions 유틸리티 적용으로 코드 중복 제거
- StatusBadge, PriorityBadge에 constants/ui 활용하여 라벨 일원화 완료
- constants/ui에 active/inactive 상태 라벨 추가
- 모든 모달을 ModalShell 컴포넌트로 통일