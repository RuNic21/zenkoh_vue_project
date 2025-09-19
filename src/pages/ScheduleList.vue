<script setup>
// スケジュール一覧ページ: プロジェクトのスケジュールを一覧表示・管理
import { ref, computed, onMounted } from "vue";
import { useScheduleStore } from "../store/schedule";
import { getStatusBadgeClass, getProgressBarClass } from "../utils/uiHelpers";

// 共有ストアからスケジュールを取得
const store = useScheduleStore();
const schedules = store.schedules;

// フィルター状態の管理
const filterStatus = ref("all");
const searchQuery = ref("");

// フィルターされたスケジュール一覧
const filteredSchedules = computed(() => {
  let filtered = schedules.value;
  
  // ステータスでフィルター
  if (filterStatus.value !== "all") {
    filtered = filtered.filter(schedule => schedule.status === filterStatus.value);
  }
  
  // 検索クエリでフィルター
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(schedule => 
      schedule.title.toLowerCase().includes(query) ||
      schedule.description.toLowerCase().includes(query) ||
      schedule.assignee.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// ステータス別の色を取得
const getStatusColor = (status) => {
  switch (status) {
    case "進行中":
      return "bg-gradient-primary";
    case "完了":
      return "bg-gradient-success";
    case "予定":
      return "bg-gradient-info";
    case "遅延":
      return "bg-gradient-warning";
    default:
      return "bg-gradient-secondary";
  }
};

// 優先度別の色を取得
const getPriorityColor = (priority) => {
  switch (priority) {
    case "高":
      return "text-danger";
    case "中":
      return "text-warning";
    case "低":
      return "text-success";
    default:
      return "text-secondary";
  }
};

// 新しいスケジュール追加
const addNewSchedule = () => {
  // 新しいスケジュール追加のロジック
  console.log("新しいスケジュールを追加します");
};

// スケジュール編集
const editSchedule = (scheduleId) => {
  // 一覧から選択して詳細へ遷移できるように選択IDをセット
  store.selectSchedule(scheduleId);
  // ルート未使用のため、親（App）に任せず一覧内では詳細ボタンでナビゲートする想定
  // 実際の遷移は App 側の「詳細を見る」ボタンやナビゲーションに合わせて行う
};

// スケジュール削除
const deleteSchedule = (scheduleId) => {
  if (confirm("このスケジュールを削除しますか？")) {
    schedules.value = schedules.value.filter(s => s.id !== scheduleId);
  }
};

// 詳細表示（選択して App 側のウォッチで詳細へ遷移）
const viewDetails = (scheduleId) => {
  store.selectSchedule(scheduleId);
};

// コンポーネント初期化
onMounted(() => {
  console.log("スケジュール一覧ページが読み込まれました");
});
</script>

<template>
  <!-- スケジュール一覧ページ -->
  <div class="schedule-list-page">
    <!-- ページヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h3 class="mb-0 h4 font-weight-bolder">スケジュール一覧</h3>
            <p class="mb-0 text-sm text-muted">
              プロジェクトのスケジュールを管理・確認できます
            </p>
          </div>
          <button 
            class="btn bg-gradient-primary"
            @click="addNewSchedule"
          >
            <i class="material-symbols-rounded me-2">add</i>
            新しいスケジュール
          </button>
        </div>
      </div>
    </div>

    <!-- フィルターと検索 -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="input-group input-group-outline">
          <label class="form-label">検索...</label>
          <input 
            type="text" 
            class="form-control"
            v-model="searchQuery"
            placeholder="タイトル、説明、担当者で検索"
          >
        </div>
      </div>
      <div class="col-md-3">
        <select 
          class="form-select"
          v-model="filterStatus"
        >
          <option value="all">すべてのステータス</option>
          <option value="予定">予定</option>
          <option value="進行中">進行中</option>
          <option value="完了">完了</option>
          <option value="遅延">遅延</option>
        </select>
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-secondary w-100">
          <i class="material-symbols-rounded me-2">filter_list</i>
          詳細フィルター
        </button>
      </div>
    </div>

    <!-- スケジュール一覧 -->
    <div class="row">
      <div 
        v-for="schedule in filteredSchedules" 
        :key="schedule.id"
        class="col-lg-6 col-xl-4 mb-4"
      >
        <div class="card h-100">
          <!-- カードヘッダー -->
          <div class="card-header pb-0">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h6 class="mb-1 font-weight-bold">{{ schedule.title }}</h6>
                <p class="text-sm text-muted mb-0">{{ schedule.description }}</p>
              </div>
              <div class="dropdown">
                <button 
                  class="btn btn-link text-muted p-0"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="material-symbols-rounded">more_vert</i>
                </button>
                <ul class="dropdown-menu">
                  <li>
                    <a 
                      class="dropdown-item" 
                      href="javascript:;"
                      @click="editSchedule(schedule.id)"
                    >
                      <i class="material-symbols-rounded me-2">edit</i>
                      編集
                    </a>
                  </li>
                  <li>
                    <a 
                      class="dropdown-item text-danger" 
                      href="javascript:;"
                      @click="deleteSchedule(schedule.id)"
                    >
                      <i class="material-symbols-rounded me-2">delete</i>
                      削除
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- カードボディ -->
          <div class="card-body pt-0">
            <!-- ステータスと優先度 -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span 
                class="badge badge-sm"
                :class="getStatusBadgeClass(schedule.status)"
              >
                {{ schedule.status }}
              </span>
              <span 
                class="text-sm font-weight-bold"
                :class="getPriorityColor(schedule.priority)"
              >
                優先度: {{ schedule.priority }}
              </span>
            </div>

            <!-- 担当者 -->
            <div class="d-flex align-items-center mb-3">
              <div class="avatar avatar-sm bg-gradient-secondary me-2">
                <i class="material-symbols-rounded text-white">person</i>
              </div>
              <div>
                <p class="text-sm mb-0 font-weight-bold">担当者</p>
                <p class="text-xs text-muted mb-0">{{ schedule.assignee }}</p>
              </div>
            </div>

            <!-- 進捗バー -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-sm font-weight-bold">進捗</span>
                <span class="text-sm text-muted">{{ schedule.progress }}%</span>
              </div>
              <div class="progress">
                <div 
                  :class="getProgressBarClass(schedule.progress)" 
                  :style="{ width: schedule.progress + '%' }"
                  role="progressbar"
                ></div>
              </div>
            </div>

            <!-- 日付情報 -->
            <div class="row text-center">
              <div class="col-6">
                <p class="text-xs text-muted mb-0">開始日</p>
                <p class="text-sm font-weight-bold mb-0">{{ schedule.startDate }}</p>
              </div>
              <div class="col-6">
                <p class="text-xs text-muted mb-0">終了日</p>
                <p class="text-sm font-weight-bold mb-0">{{ schedule.endDate }}</p>
              </div>
            </div>
          </div>

          <!-- カードフッター -->
          <div class="card-footer pt-0">
            <div class="d-flex justify-content-between">
              <button 
                class="btn btn-outline-primary btn-sm"
                @click="editSchedule(schedule.id)"
              >
                <i class="material-symbols-rounded me-1">edit</i>
                編集
              </button>
              <button class="btn btn-outline-info btn-sm" @click="viewDetails(schedule.id)">
                <i class="material-symbols-rounded me-1">visibility</i>
                詳細
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- スケジュールが存在しない場合 -->
    <div v-if="filteredSchedules.length === 0" class="text-center py-5">
      <div class="icon icon-shape icon-lg bg-gradient-secondary mx-auto mb-3">
        <i class="material-symbols-rounded text-white opacity-10">schedule</i>
      </div>
      <h5 class="text-muted">スケジュールが見つかりません</h5>
      <p class="text-muted">新しいスケジュールを作成するか、フィルターを調整してください。</p>
      <button 
        class="btn bg-gradient-primary"
        @click="addNewSchedule"
      >
        <i class="material-symbols-rounded me-2">add</i>
        新しいスケジュールを作成
      </button>
    </div>
  </div>
</template>

<style scoped>
/* スケジュール一覧ページのスタイリング */
.schedule-list-page {
  padding: 1rem;
}

/* カードのスタイリング */
.card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* バッジのスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
}

/* プログレスバーのスタイリング */
.progress {
  height: 6px;
  border-radius: 3px;
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* ドロップダウンメニューのスタイリング */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
}

.dropdown-item {
  transition: all 0.2s ease-in-out;
}

.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .schedule-list-page {
    padding: 0.5rem;
  }
  
  .card-body {
    padding: 1rem;
  }
}
</style>
