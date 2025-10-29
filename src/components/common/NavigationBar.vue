<script setup lang="ts">
// ナビゲーションバーコンポーネント: ページタイトル・検索・通知・設定を表示
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { useNotifications } from "@/composables/useNotifications";
import { MAX_NOTIFICATION_BADGE_COUNT } from "@/constants/notification";

// Props 定義
interface Props {
  currentPage: string;
}

const props = defineProps<Props>();
const router = useRouter();

// 認証状態を取得
const { user, displayName, isAuthenticated, logout } = useAuth();

// 通知を取得
const {
  recentNotifications,
  unreadBadgeCount,
  hasUnread,
  markAsRead,
  markAllAsRead
} = useNotifications();

// ページ名から表示テキストを取得
const pageDisplayName = computed(() => {
  switch (props.currentPage) {
    case "dashboard":
      return "ダッシュボード";
    case "project-management":
      return "プロジェクト管理";
    case "project-detail":
      return "プロジェクト詳細";
    case "team":
      return "チーム管理";
    case "report":
      return "レポート";
    case "schedule-list":
      return "タスク管理";
    case "schedule-detail":
      return "タスク詳細";
    default:
      return "プロジェクト管理";
  }
});

// ログアウト処理
const handleLogout = async () => {
  if (confirm("ログアウトしますか？")) {
    await logout();
  }
};

// 通知を既読にする
const handleNotificationClick = async (notificationId: number) => {
  await markAsRead(notificationId);
};

// すべての通知を既読にする
const handleMarkAllAsRead = async () => {
  await markAllAsRead();
};

// 通知管理ページへ移動
const goToNotifications = () => {
  router.push("/team");
};

// 相対時間を取得
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;
  
  return date.toLocaleDateString("ja-JP");
};
</script>

<template>
  <!-- ナビゲーションバー -->
  <nav
    class="navbar navbar-main navbar-expand-lg px-0 mx-3 shadow-none border-radius-xl"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="container-fluid py-1 px-3">
      <!-- パンくずリスト -->
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
          <li class="breadcrumb-item text-sm">
            <a class="opacity-5 text-dark" href="javascript:;">ページ</a>
          </li>
          <li class="breadcrumb-item text-sm text-dark active" aria-current="page">
            {{ pageDisplayName }}
          </li>
        </ol>
      </nav>

      <!-- 検索・アイコンエリア -->
      <div class="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
        <!-- 検索フォーム（グローバル検索は将来実装予定） -->
        <!-- <div class="ms-md-auto pe-md-3 d-flex align-items-center">
          <div class="input-group input-group-outline">
            <label class="form-label"></label>
            <input
              type="text"
              class="form-control"
              placeholder="プロジェクトや担当者を検索してください"
            />
          </div>
        </div> -->

        <!-- 右側アイコンメニュー -->
        <ul class="navbar-nav d-flex align-items-center justify-content-end">
          <!-- 設定アイコン -->
          <li class="nav-item px-3 d-flex align-items-center">
            <a href="javascript:;" class="nav-link text-body p-0">
              <i class="material-symbols-rounded fixed-plugin-button-nav">settings</i>
            </a>
          </li>

          <!-- 通知ドロップダウン -->
          <li class="nav-item dropdown pe-3 d-flex align-items-center">
            <a
              href="javascript:;"
              class="nav-link text-body p-0 position-relative"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="material-symbols-rounded">notifications</i>
              <!-- 未読バッジ -->
              <span 
                v-if="hasUnread" 
                class="notification-badge badge badge-sm bg-gradient-danger"
              >
                {{ unreadBadgeCount }}
              </span>
            </a>
            <ul
              class="dropdown-menu dropdown-menu-end px-2 py-3 me-sm-n4"
              aria-labelledby="dropdownMenuButton"
              style="min-width: 350px; max-height: 400px; overflow-y: auto;"
            >
              <!-- ヘッダー -->
              <li class="mb-2 px-3 d-flex justify-content-between align-items-center">
                <h6 class="text-sm font-weight-bold mb-0">通知</h6>
                <button 
                  v-if="hasUnread"
                  class="btn btn-link text-xs p-0 m-0"
                  @click="handleMarkAllAsRead"
                >
                  すべて既読
                </button>
              </li>
              <li><hr class="dropdown-divider mt-0"></li>
              
              <!-- 通知リスト -->
              <li v-if="recentNotifications.length === 0" class="px-3 py-4 text-center">
                <i class="fa fa-bell-slash fa-2x text-secondary opacity-6 mb-2"></i>
                <p class="text-sm text-secondary mb-0">通知はありません</p>
              </li>
              
              <li 
                v-for="notification in recentNotifications" 
                :key="notification.id"
                class="mb-2"
              >
                <a 
                  class="dropdown-item border-radius-md"
                  :class="{ 'bg-gray-100': notification.status === 'QUEUED' }"
                  href="javascript:;"
                  @click="handleNotificationClick(notification.id)"
                >
                  <div class="d-flex py-1">
                    <div class="my-auto">
                      <div 
                        class="avatar avatar-sm me-3"
                        :class="notification.status === 'QUEUED' ? 'bg-gradient-info' : 'bg-gradient-secondary'"
                      >
                        <i class="material-symbols-rounded text-white">mail</i>
                      </div>
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                      <h6 class="text-sm font-weight-normal mb-1">
                        <span class="font-weight-bold">{{ notification.subject }}</span>
                      </h6>
                      <p class="text-xs text-secondary mb-0" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ notification.body_text }}
                      </p>
                      <p class="text-xs text-secondary mb-0 mt-1">
                        <i class="fa fa-clock me-1"></i>
                        {{ getRelativeTime(notification.created_at) }}
                      </p>
                    </div>
                  </div>
                </a>
              </li>
              
              <!-- フッター -->
              <li v-if="recentNotifications.length > 0">
                <hr class="dropdown-divider">
              </li>
              <li v-if="recentNotifications.length > 0" class="text-center">
                <a 
                  class="dropdown-item border-radius-md text-center"
                  href="javascript:;"
                  @click="goToNotifications"
                >
                  <span class="text-sm font-weight-bold text-primary">
                    すべての通知を見る
                  </span>
                </a>
              </li>
            </ul>
          </li>

          <!-- ユーザーメニュー -->
          <li v-if="isAuthenticated" class="nav-item dropdown d-flex align-items-center">
            <a
              href="javascript:;"
              class="nav-link text-body font-weight-bold px-0 dropdown-toggle"
              id="userMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="material-symbols-rounded me-1">account_circle</i>
              <span class="d-none d-sm-inline">{{ displayName }}</span>
            </a>
            <ul
              class="dropdown-menu dropdown-menu-end px-2 py-3"
              aria-labelledby="userMenuButton"
            >
              <li class="mb-2">
                <a class="dropdown-item border-radius-md" href="javascript:;">
                  <div class="d-flex align-items-center">
                    <i class="material-symbols-rounded me-2">person</i>
                    <span>プロフィール</span>
                  </div>
                </a>
              </li>
              <li class="mb-2">
                <a class="dropdown-item border-radius-md" href="javascript:;">
                  <div class="d-flex align-items-center">
                    <i class="material-symbols-rounded me-2">settings</i>
                    <span>設定</span>
                  </div>
                </a>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a 
                  class="dropdown-item border-radius-md text-danger" 
                  href="javascript:;"
                  @click="handleLogout"
                >
                  <div class="d-flex align-items-center">
                    <i class="material-symbols-rounded me-2">logout</i>
                    <span>ログアウト</span>
                  </div>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <!-- ナビゲーションバー終了 -->
</template>

<style scoped>
/* ナビゲーションバー固有のスタイルは Material Dashboard のデフォルトを使用 */

/* 通知バッジ */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 未読通知の背景色 */
.bg-gray-100 {
  background-color: #f8f9fa !important;
}

/* ドロップダウンメニューのスクロール */
.dropdown-menu {
  max-height: 400px;
  overflow-y: auto;
}

/* ドロップダウンアイテムホバー効果 */
.dropdown-item:hover {
  background-color: #f0f2f5;
  transition: background-color 0.2s ease;
}

/* アバターアイコンサイズ調整 */
.avatar.avatar-sm {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar.avatar-sm i {
  font-size: 18px;
}
</style>

