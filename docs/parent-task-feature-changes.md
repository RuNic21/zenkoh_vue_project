# 부모 태스크 등록 기능 추가 - 수정 가이드

## 📝 수정 사항

### 1. 47-48번째 줄: composable에서 반환하는 값 추가

**현재:**
```typescript
  availableUsers,     // 選択可能ユーザー一覧
  changeStatus,       // ステータス変更関数
```

**수정 후:**
```typescript
  availableUsers,     // 選択可能ユーザー一覧
  availableParentTasks, // 選択可能な親タスク一覧
  isLoadingParentTasks, // 親タスク読み込み中フラグ
  changeStatus,       // ステータス変更関数
```

### 2. 55번째 줄: loadParentTasks 추가

**현재:**
```typescript
  loadTaskById,       // タスク読み込み関数
} = useScheduleDetail(route.params.id as string);
```

**수정 후:**
```typescript
  loadTaskById,       // タスク読み込み関数
  loadParentTasks,    // 親タスク候補読み込み関数
} = useScheduleDetail(route.params.id as string);
```

### 3. 193번째 줄 이후: 부모 태스크 변경 함수 추가

**현재:**
```typescript
// 担当者変更
const changeAssignee = (userId: number) => {
  const user = availableUsers.value.find(u => u.id === userId);
  if (user) {
    editForm.value.assignee = user.name;
  }
};

// クイックアクション実行
```

**수정 후:**
```typescript
// 担当者変更
const changeAssignee = (userId: number) => {
  const user = availableUsers.value.find(u => u.id === userId);
  if (user) {
    editForm.value.assignee = user.name;
  }
};

// 親タスク変更
const changeParentTask = (taskId: number | null) => {
  if (taskId === null || taskId === 0) {
    // 親タスクを解除
    editForm.value.parentTaskId = null;
    editForm.value.parentTaskName = undefined;
  } else {
    // 親タスクを設定
    const parentTask = availableParentTasks.value.find(t => t.id === taskId);
    if (parentTask) {
      editForm.value.parentTaskId = parentTask.id;
      editForm.value.parentTaskName = parentTask.task_name;
    }
  }
};

// クイックアクション実行
```

### 4. 571번째 줄 이후 (日付情報 카드 다음, タグ 카드 전): UI 추가

**현재:**
```vue
          </div>
        </div>

        <!-- タグ -->
        <div class="card mb-4">
          <CardHeader title="タグ" subtitle="タスクに関連するタグを管理できます" />
```

**수정 후:**
```vue
          </div>
        </div>

        <!-- 親タスク -->
        <div class="card mb-4">
          <CardHeader title="親タスク" subtitle="このタスクの親タスクを設定できます" />
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label text-sm">親タスク</label>
              <template v-if="isEditMode">
                <select
                  class="form-select form-select-sm"
                  :value="editForm.parentTaskId || null"
                  @change="changeParentTask(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                >
                  <option :value="null">親タスクなし</option>
                  <option 
                    v-for="task in availableParentTasks" 
                    :key="task.id" 
                    :value="task.id"
                  >
                    {{ task.task_name }}
                  </option>
                </select>
                <div v-if="isLoadingParentTasks" class="text-muted text-xs mt-2">
                  <i class="material-symbols-rounded" style="font-size: 0.875rem;">sync</i>
                  親タスク候補を読み込み中...
                </div>
              </template>
              <template v-else>
                <p v-if="scheduleDetail.parentTaskName" class="form-control-plaintext">
                  <i class="material-symbols-rounded me-1" style="font-size: 1rem;">account_tree</i>
                  {{ scheduleDetail.parentTaskName }}
                </p>
                <p v-else class="form-control-plaintext text-muted">
                  親タスクが設定されていません
                </p>
              </template>
            </div>
          </div>
        </div>

        <!-- タグ -->
        <div class="card mb-4">
          <CardHeader title="タグ" subtitle="タスクに関連するタグを管理できます" />
```

## ✅ 완료된 작업

1. ✅ `src/types/schedule.ts` - `ScheduleItem` 타입에 `parentTaskId`와 `parentTaskName` 필드 추가 완료

## 📌 참고사항

- `useScheduleDetail` composable에는 이미 `availableParentTasks`, `isLoadingParentTasks`, `loadParentTasks` 함수가 구현되어 있습니다.
- `taskAdapter.ts`에서 이미 부모 태스크 정보를 처리하는 로직이 있습니다.
- 저장 시 `parent_task_id`가 자동으로 업데이트됩니다.


