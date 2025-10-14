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

## 다음에 진행할 후보
- [ ] ScheduleList.vue/Detail.vue, TeamManagement.vue에 공통 컴포넌트 적용 정리
  - [ ] PageHeader/CardHeader/ActionBar/StatCards 적용 포인트 식별 및 교체
  - [ ] 해당 페이지의 테이블에 TableControls/Slots(배지) 적용
  - [ ] 모달이 있으면 ModalShell로 교체
- [ ] ReportChart.vue에 chartOptions 적용(内部オプション集約)
- [ ] constants/ui 활용 범위 확대(상태/우선순위 라벨 일원화)
- [ ] 접근성(A11y) 개선: 배지/페이지네이션/로딩 aria-속성 보강
- [ ] 단위 테스트: TableControls, Pagination, Badge, exportUtils, formatters
- [ ] Storybook/문서 초안: common/*, table/* 컴포넌트 사용 예시 정리

## 메모
- 현재 두 핵심 페이지(Report, ProjectManagement)는 공통화 반영 완료 및 린트 통과 상태입니다.
- 나머지 페이지는 영향 범위가 커서 단계적으로 적용 권장합니다(우선순위: Schedule → Team).