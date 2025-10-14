<script setup lang="ts">
// スケジュール一覧ページ: プロジェクト別にタスクをグループ化して表示・管理

// TODO: DB連携されていない機能
// 1. コメントシステム - 現在メモリ上でのみ管理
//    - tasksテーブルにcomments JSONBカラム追加が必要
//    - コメントCRUDサービス実装が必要
//    - コメントデータをDBからロード/保存するロジック実装が必要
//
// 2. 添付ファイルシステム - 現在メモリ上でのみ管理
//    - tasksテーブルにattachments JSONBカラム追加が必要
//    - ファイルアップロード/ダウンロードサービス実装が必要
//    - 添付ファイルメタデータをDBからロード/保存するロジック実装が必要
//
// 3. タグシステム - 現在デフォルト値（空配列）でのみ設定
//    - tasksテーブルにtags TEXT[]カラム追加が必要
//    - タグ管理サービス実装が必要
//    - タグデータをDBからロード/保存するロジック実装が必要
//
// 4. メモ/ノートシステム - 現在デフォルト値（空文字列）でのみ設定
//    - tasksテーブルにnotes TEXTカラム追加が必要
//    - メモデータをDBからロード/保存するロジック実装が必要
//
// 5. ユーザー認証システム - 現在ハードコードされたユーザー名を使用
//    - 実際のユーザー認証システム実装が必要
//    - 現在のユーザー情報を動的に取得するロジック実装が必要
//
// 6. リアルタイム更新 - 現在手動リフレッシュが必要
//    - WebSocketまたはServer-Sent Events実装が必要
//    - リアルタイムデータ同期機能実装が必要
//
// 7. ペイジング機能 - 現在未実装
//    - 基本ペイジング機能実装が必要
//      * プロジェクト別ペイジング（6個ずつ表示）
//      * ページネーションコントロール（前/次/ページ番号）
//      * ページ情報表示（X個中Y-Z件表示）
//      * フィルター変更時のページリセット
//    - 高級ペイジング機能実装が必要
//      * ペイジングモード切り替え（通常/無限スクロール）
//      * ページサイズ選択（3,6,9,12,15件）
//      * ソート機能（名前/日付/完了率/進捗率）
//      * ソート順序切り替え（昇順/降順）
//      * 無限スクロール「さらに読み込む」ボタン
//      * キーボードショートカット（Ctrl+←/→, Ctrl+Home/End）
//    - パフォーマンス最適化実装が必要
//      * サーバーサイドペイジング対応
//      * データキャッシュ機能（5分間有効）
//      * パフォーマンスメトリクス（読み込み時間/レンダリング時間/キャッシュヒット率）
//      * メモリ管理（最大50エントリキャッシュ制限）
//      * パフォーマンスレポート生成
//      * キャッシュクリア機能
//    - UI/UX最適化実装が必要
//      * レスポンシブデザイン（デスクトップ/タブレット/モバイル）
//      * ローディングアニメーション
//      * ページ移動時のスムーススクロール
//      * アクセシビリティ対応
//    - データベース最適化実装が必要
//      * インデックス最適化（ソート用）
//      * クエリ最適化（LIMIT/OFFSET）
//      * バックグラウンドプリロード
//      * 仮想スクロール対応準備

import { ref, computed, onMounted } from "vue";
import { useScheduleStore } from "../store/schedule";
import { getStatusBadgeClass, getProgressBarClass, getPriorityColorClass } from "../utils/uiHelpers";
import type { ScheduleItem } from "../types/schedule";
import type { Project } from "../types/project";

// 共有ストア（DB値に置き換えて利用）
const store = useScheduleStore();
const schedules = store.schedules;
const isLoading = store.isLoading;
const errorMessage = store.errorMessage;

// プロジェクト情報を格納
const projects = ref<Project[]>([]);

// DBからスケジュールとプロジェクトを読み込み（ストア経由）
const loadSchedulesFromDb = async (): Promise<void> => {
  try {
    await store.loadAll();
    // プロジェクト情報も取得
    await loadProjects();
  } catch (e) {
    console.error("スケジュールの読み込みに失敗", e);
  }
};

// プロジェクト一覧を読み込み
const loadProjects = async (): Promise<void> => {
  try {
    const { listProjects } = await import("../services/projectService");
    const result = await listProjects();
    if (result.success && result.data) {
      projects.value = result.data;
    } else {
      console.error("プロジェクトの読み込みに失敗:", result.error);
      projects.value = [];
    }
  } catch (e) {
    console.error("プロジェクトの読み込みに失敗", e);
    projects.value = [];
  }
};

// フィルター状態の管理
const filterStatus = ref("all");
const searchQuery = ref("");
const selectedProjectId = ref<number | null>(null);

// プロジェクト別にスケジュールをグループ化
const groupedSchedules = computed(() => {
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
      schedule.assignee.toLowerCase().includes(query) ||
      (schedule.category || "").toLowerCase().includes(query)
    );
  }
  
  // プロジェクトでフィルター
  if (selectedProjectId.value !== null) {
    const selectedProject = projects.value.find(p => p.id === selectedProjectId.value);
    if (selectedProject) {
      filtered = filtered.filter(schedule => schedule.category === selectedProject.name);
    }
  }
  
  // プロジェクト別にグループ化
  const groups: { [key: string]: ScheduleItem[] } = {};
  
  filtered.forEach(schedule => {
    const projectName = schedule.category || "プロジェクト未設定";
    if (!groups[projectName]) {
      groups[projectName] = [];
    }
    groups[projectName].push(schedule);
  });
  
  return groups;
});

// プロジェクト統計情報を計算
const projectStats = computed(() => {
  const stats: { [key: string]: { total: number; completed: number; inProgress: number; pending: number } } = {};
  
  Object.entries(groupedSchedules.value).forEach(([projectName, tasks]) => {
    stats[projectName] = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === "完了").length,
      inProgress: tasks.filter(t => t.status === "進行中").length,
      pending: tasks.filter(t => t.status === "予定").length
    };
  });
  
  return stats;
});

// ステータス別の色を取得（uiHelpersからインポート済み）
// 優先度別の色を取得（uiHelpersからインポート済み）

// 新しいスケジュール追加
const addNewSchedule = async () => {
  try {
    // デフォルトの新しいスケジュールを作成
    const newSchedule = {
      title: "新しいスケジュール",
      description: "",
      startDate: "",
      endDate: "",
      status: "予定" as const,
      priority: "中" as const,
      assignee: "",
      progress: 0,
      category: "",
    };
    
    const created = await store.create(newSchedule);
    if (created) {
      console.log("新しいスケジュールを作成しました:", created.id);
    } else {
      throw new Error("スケジュールの作成に失敗しました");
    }
  } catch (e) {
    console.error("スケジュールの作成に失敗", e);
    const message = e instanceof Error ? e.message : "スケジュールの作成に失敗しました";
    errorMessage.value = message;
  }
};

// スケジュール編集
const editSchedule = (scheduleId: number) => {
  // 一覧から選択して詳細へ遷移できるように選択IDをセット
  store.selectSchedule(scheduleId);
  // App.vue の watch で自動的に詳細ページへ遷移
};

// スケジュール削除（ストア経由）
const deleteSchedule = async (scheduleId: number) => {
  if (!confirm("このスケジュールを削除しますか？")) return;
  try {
    await store.delete(scheduleId);
    console.log("スケジュールを削除しました:", scheduleId);
  } catch (e) {
    console.error("削除に失敗", e);
    const message = e instanceof Error ? e.message : "削除に失敗しました";
    errorMessage.value = message;
  }
};

// 詳細表示（選択して App 側のウォッチで詳細へ遷移）
const viewDetails = (scheduleId: number) => {
  store.selectSchedule(scheduleId);
  // App.vue の watch で自動的に詳細ページへ遷移
};

// コンポーネント初期化
onMounted(() => {
  console.log("スケジュール一覧ページが読み込まれました");
  loadSchedulesFromDb();
});
</script>

<template>
  <!-- スケジュール一覧ページ -->
  <div class="schedule-list-page">
    <!-- ローディング/エラー表示 -->
    <div v-if="isLoading" class="alert alert-secondary" role="alert">
      読み込み中です...
    </div>
    <div v-if="!isLoading && errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>
    <!-- ページヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h3 class="mb-0 h4 font-weight-bolder">タスク一覧</h3>
            <p class="mb-0 text-sm text-muted">
              プロジェクト別にタスクを管理・確認できます
            </p>
          </div>
          <button 
            class="btn bg-gradient-primary"
            @click="addNewSchedule"
          >
            <i class="material-symbols-rounded me-2">add</i>
            新しいタスク
          </button>
        </div>
      </div>
    </div>

    <!-- フィルターと検索 -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="input-group input-group-outline">
          <label class="form-label">検索...</label>
          <input 
            type="text" 
            class="form-control"
            v-model="searchQuery"
            placeholder="タスク名、説明、担当者、プロジェクトで検索"
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
        <select 
          class="form-select"
          v-model="selectedProjectId"
        >
          <option :value="null">すべてのプロジェクト</option>
          <option 
            v-for="project in projects" 
            :key="project.id" 
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-outline-secondary w-100">
          <i class="material-symbols-rounded me-2">filter_list</i>
          詳細フィルター
        </button>
      </div>
    </div>

    <!-- プロジェクト別タスク一覧 -->
    <div class="project-groups">
      <div 
        v-for="(tasks, projectName) in groupedSchedules" 
        :key="projectName"
        class="project-group mb-5"
      >
        <!-- プロジェクトヘッダー -->
        <div class="project-header mb-4">
          <div class="card">
            <div class="card-header pb-0">
              <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                  <h5 class="mb-1 font-weight-bold text-primary">
                    <i class="material-symbols-rounded me-2">folder</i>
                    {{ projectName }}
                  </h5>
                  <p class="text-sm text-muted mb-0">
                    {{ tasks.length }}個のタスク
                  </p>
                </div>
                <div class="project-stats">
                  <div class="d-flex gap-3">
                    <div class="text-center">
                      <div class="text-sm font-weight-bold text-success">{{ projectStats[projectName]?.completed || 0 }}</div>
                      <div class="text-xs text-muted">完了</div>
                    </div>
                    <div class="text-center">
                      <div class="text-sm font-weight-bold text-warning">{{ projectStats[projectName]?.inProgress || 0 }}</div>
                      <div class="text-xs text-muted">進行中</div>
                    </div>
                    <div class="text-center">
                      <div class="text-sm font-weight-bold text-info">{{ projectStats[projectName]?.pending || 0 }}</div>
                      <div class="text-xs text-muted">予定</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- タスクカード一覧 -->
        <div class="row">
          <div 
            v-for="schedule in tasks" 
            :key="schedule.id"
            class="col-lg-6 col-xl-4 mb-4"
          >
            <div class="card h-100 task-card">
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
                    :class="getPriorityColorClass(schedule.priority)"
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
      </div>
    </div>

    <!-- タスクが存在しない場合 -->
    <div v-if="Object.keys(groupedSchedules).length === 0" class="text-center py-5">
      <div class="icon icon-shape icon-lg bg-gradient-secondary mx-auto mb-3">
        <i class="material-symbols-rounded text-white opacity-10">task</i>
      </div>
      <h5 class="text-muted">タスクが見つかりません</h5>
      <p class="text-muted">新しいタスクを作成するか、フィルターを調整してください。</p>
      <button 
        class="btn bg-gradient-primary"
        @click="addNewSchedule"
      >
        <i class="material-symbols-rounded me-2">add</i>
        新しいタスクを作成
      </button>
    </div>
  </div>
</template>

<style scoped>
/* プロジェクト別タスク一覧ページのスタイリング */
.schedule-list-page {
  padding: 1rem;
}

/* プロジェクトグループのスタイリング */
.project-groups {
  margin-top: 2rem;
}

.project-group {
  border-left: 4px solid #e3f2fd;
  padding-left: 1rem;
  margin-bottom: 3rem;
}

.project-group:last-child {
  margin-bottom: 0;
}

/* プロジェクトヘッダーのスタイリング */
.project-header .card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 0.75rem;
}

.project-header .card-header {
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.project-stats {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
}

/* タスクカードのスタイリング */
.task-card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0.75rem;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 123, 255, 0.2);
}

/* バッジのスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
}

/* プログレスバーのスタイリング */
.progress {
  height: 6px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.05);
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
  border-radius: 0.5rem;
}

.btn:hover {
  transform: translateY(-1px);
}

/* ドロップダウンメニューのスタイリング */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 0;
}

.dropdown-item {
  transition: all 0.2s ease-in-out;
  border-radius: 0.25rem;
  margin: 0 0.5rem;
}

.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* アバターのスタイリング */
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

/* プロジェクト統計の色分け */
.text-success {
  color: #28a745 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-info {
  color: #17a2b8 !important;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .schedule-list-page {
    padding: 0.5rem;
  }
  
  .project-group {
    padding-left: 0.5rem;
    border-left-width: 2px;
  }
  
  .project-header .card-header {
    padding: 1rem;
  }
  
  .project-stats {
    padding: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .task-card .card-body {
    padding: 1rem;
  }
  
  .d-flex.gap-3 {
    gap: 1rem !important;
  }
}

@media (max-width: 576px) {
  .project-stats .d-flex {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .project-stats .d-flex > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }
}
</style>
