<script setup>
// スケジュール詳細ページ: 個別スケジュールの詳細表示・編集
import { ref, computed, onMounted } from "vue";

// スケジュール詳細データの管理
const scheduleDetail = ref({
  id: 1,
  title: "プロジェクトA - 初期設計",
  description: "システムの基本設計とアーキテクチャの検討",
  startDate: "2024-01-15",
  endDate: "2024-01-30",
  status: "進行中",
  priority: "高",
  assignee: "田中太郎",
  progress: 65,
  category: "開発",
  tags: ["設計", "アーキテクチャ", "要件定義"],
  notes: "システムの基本設計を完了し、アーキテクチャの検討を進めています。",
  attachments: [
    { name: "設計書_v1.0.pdf", size: "2.3MB", type: "pdf" },
    { name: "要件定義書.docx", size: "1.8MB", type: "docx" }
  ],
  comments: [
    {
      id: 1,
      author: "佐藤花子",
      content: "設計書のレビューが完了しました。",
      timestamp: "2024-01-20 14:30",
      avatar: "SH"
    },
    {
      id: 2,
      author: "鈴木一郎",
      content: "アーキテクチャの検討について質問があります。",
      timestamp: "2024-01-21 09:15",
      avatar: "SI"
    }
  ]
});

// 編集モードの管理
const isEditMode = ref(false);
const editForm = ref({ ...scheduleDetail.value });

// 新しいコメントの入力
const newComment = ref("");

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

// 編集モードの切り替え
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value) {
    editForm.value = { ...scheduleDetail.value };
  }
};

// 保存処理
const saveChanges = () => {
  scheduleDetail.value = { ...editForm.value };
  isEditMode.value = false;
  console.log("スケジュールが保存されました");
};

// キャンセル処理
const cancelEdit = () => {
  editForm.value = { ...scheduleDetail.value };
  isEditMode.value = false;
};

// コメント追加
const addComment = () => {
  if (newComment.value.trim()) {
    const comment = {
      id: Date.now(),
      author: "現在のユーザー",
      content: newComment.value,
      timestamp: new Date().toLocaleString('ja-JP'),
      avatar: "U"
    };
    scheduleDetail.value.comments.push(comment);
    newComment.value = "";
  }
};

// ファイル添付
const handleFileUpload = (event) => {
  const files = event.target.files;
  for (let file of files) {
    const attachment = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + "MB",
      type: file.name.split('.').pop()
    };
    scheduleDetail.value.attachments.push(attachment);
  }
};

// コンポーネント初期化
onMounted(() => {
  console.log("スケジュール詳細ページが読み込まれました");
});
</script>

<template>
  <!-- スケジュール詳細ページ -->
  <div class="schedule-detail-page">
    <!-- ページヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h3 class="mb-0 h4 font-weight-bolder">スケジュール詳細</h3>
            <p class="mb-0 text-sm text-muted">
              スケジュールの詳細情報を確認・編集できます
            </p>
          </div>
          <div class="d-flex gap-2">
            <button 
              v-if="!isEditMode"
              class="btn btn-outline-primary"
              @click="toggleEditMode"
            >
              <i class="material-symbols-rounded me-2">edit</i>
              編集
            </button>
            <button 
              v-else
              class="btn bg-gradient-primary"
              @click="saveChanges"
            >
              <i class="material-symbols-rounded me-2">save</i>
              保存
            </button>
            <button 
              v-if="isEditMode"
              class="btn btn-outline-secondary"
              @click="cancelEdit"
            >
              <i class="material-symbols-rounded me-2">cancel</i>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- メインコンテンツ -->
      <div class="col-lg-8">
        <!-- 基本情報カード -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">基本情報</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">タイトル</label>
                <input 
                  v-if="isEditMode"
                  type="text" 
                  class="form-control"
                  v-model="editForm.title"
                >
                <p v-else class="form-control-plaintext">{{ scheduleDetail.title }}</p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">カテゴリ</label>
                <select 
                  v-if="isEditMode"
                  class="form-select"
                  v-model="editForm.category"
                >
                  <option value="開発">開発</option>
                  <option value="テスト">テスト</option>
                  <option value="デザイン">デザイン</option>
                  <option value="その他">その他</option>
                </select>
                <p v-else class="form-control-plaintext">{{ scheduleDetail.category }}</p>
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">説明</label>
                <textarea 
                  v-if="isEditMode"
                  class="form-control"
                  rows="3"
                  v-model="editForm.description"
                ></textarea>
                <p v-else class="form-control-plaintext">{{ scheduleDetail.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 進捗とメモ -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">進捗とメモ</h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">進捗率</label>
              <div class="d-flex align-items-center">
                <input 
                  v-if="isEditMode"
                  type="range" 
                  class="form-range me-3"
                  min="0"
                  max="100"
                  v-model="editForm.progress"
                >
                <span class="badge bg-gradient-primary">{{ scheduleDetail.progress }}%</span>
              </div>
              <div class="progress mt-2">
                <div 
                  class="progress-bar bg-gradient-primary" 
                  :style="{ width: scheduleDetail.progress + '%' }"
                ></div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">メモ</label>
              <textarea 
                v-if="isEditMode"
                class="form-control"
                rows="3"
                v-model="editForm.notes"
              ></textarea>
              <p v-else class="form-control-plaintext">{{ scheduleDetail.notes }}</p>
            </div>
          </div>
        </div>

        <!-- コメントセクション -->
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">コメント</h6>
          </div>
          <div class="card-body">
            <!-- コメント一覧 -->
            <div class="timeline timeline-one-side">
              <div 
                v-for="comment in scheduleDetail.comments" 
                :key="comment.id"
                class="timeline-block mb-3"
              >
                <span class="timeline-step">
                  <div class="avatar avatar-sm bg-gradient-secondary">
                    <span class="text-white text-xs">{{ comment.avatar }}</span>
                  </div>
                </span>
                <div class="timeline-content">
                  <h6 class="text-dark text-sm font-weight-bold mb-0">{{ comment.author }}</h6>
                  <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">{{ comment.timestamp }}</p>
                  <p class="text-sm mt-2 mb-0">{{ comment.content }}</p>
                </div>
              </div>
            </div>

            <!-- 新しいコメント入力 -->
            <div class="mt-4">
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control"
                  v-model="newComment"
                  placeholder="コメントを入力..."
                  @keyup.enter="addComment"
                >
                <button 
                  class="btn bg-gradient-primary"
                  @click="addComment"
                >
                  <i class="material-symbols-rounded">send</i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- サイドバー -->
      <div class="col-lg-4">
        <!-- ステータスと優先度 -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">ステータス</h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">ステータス</span>
              <span 
                class="badge"
                :class="getStatusColor(scheduleDetail.status)"
              >
                {{ scheduleDetail.status }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">優先度</span>
              <span 
                class="text-sm font-weight-bold"
                :class="getPriorityColor(scheduleDetail.priority)"
              >
                {{ scheduleDetail.priority }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-sm">担当者</span>
              <span class="text-sm font-weight-bold">{{ scheduleDetail.assignee }}</span>
            </div>
          </div>
        </div>

        <!-- 日付情報 -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">スケジュール</h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label text-sm">開始日</label>
              <input 
                v-if="isEditMode"
                type="date" 
                class="form-control"
                v-model="editForm.startDate"
              >
              <p v-else class="form-control-plaintext">{{ scheduleDetail.startDate }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-sm">終了日</label>
              <input 
                v-if="isEditMode"
                type="date" 
                class="form-control"
                v-model="editForm.endDate"
              >
              <p v-else class="form-control-plaintext">{{ scheduleDetail.endDate }}</p>
            </div>
          </div>
        </div>

        <!-- タグ -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">タグ</h6>
          </div>
          <div class="card-body">
            <div class="d-flex flex-wrap gap-2">
              <span 
                v-for="tag in scheduleDetail.tags" 
                :key="tag"
                class="badge bg-gradient-info"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- 添付ファイル -->
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">添付ファイル</h6>
          </div>
          <div class="card-body">
            <div v-if="scheduleDetail.attachments.length > 0">
              <div 
                v-for="file in scheduleDetail.attachments" 
                :key="file.name"
                class="d-flex align-items-center mb-2"
              >
                <i class="material-symbols-rounded me-2">attach_file</i>
                <div class="flex-grow-1">
                  <p class="text-sm mb-0">{{ file.name }}</p>
                  <p class="text-xs text-muted mb-0">{{ file.size }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <p class="text-sm mb-0">添付ファイルはありません</p>
            </div>
            <div v-if="isEditMode" class="mt-3">
              <input 
                type="file" 
                class="form-control"
                multiple
                @change="handleFileUpload"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* スケジュール詳細ページのスタイリング */
.schedule-detail-page {
  padding: 1rem;
}

/* カードのスタイリング */
.card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* プログレスバーのスタイリング */
.progress {
  height: 8px;
  border-radius: 4px;
}

/* タイムラインのスタイリング */
.timeline-step {
  position: relative;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* バッジのスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* フォームのスタイリング */
.form-control-plaintext {
  background-color: transparent;
  border: none;
  padding: 0.375rem 0;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .schedule-detail-page {
    padding: 0.5rem;
  }
  
  .card-body {
    padding: 1rem;
  }
}
</style>
