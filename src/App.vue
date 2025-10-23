<script setup lang="ts">
// プロジェクト管理スケジューラー: メインアプリケーションコンポーネント
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useScheduleStore } from "./store/schedule";
import MainLayout from "./layouts/MainLayout.vue";
// 共通コンポーネント
import NavigationBar from "./components/common/NavigationBar.vue";
import ToastMessage from "./components/common/ToastMessage.vue";
import ConfirmDialog from "./components/common/ConfirmDialog.vue";

const route = useRoute();
const store = useScheduleStore();


// アプリケーション初期化
onMounted(async () => {
  console.log("プロジェクト管理スケジューラーが起動しました（Vue Router統合版）");
  // スケジュールデータを DB から読み込み
  store.loadAll().catch((e) => console.error("初期データの読み込みに失敗", e));
});
</script>

<template>
  <!-- メインレイアウトコンテナ -->
  <div id="app" class="g-sidenav-show bg-gray-100">
    <!-- メインレイアウトコンポーネント -->
    <MainLayout>
      <!-- 動的コンテンツエリア -->
      <div class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
        
        <!-- ナビゲーションバー -->
        <NavigationBar :current-page="route.name?.toString() || 'dashboard'" />

        <!-- メインコンテンツエリア -->
        <div class="container-fluid py-4">
          <!-- Vue Router による動的ページ表示 -->
          <router-view />
        </div>
      </div>
    </MainLayout>
  </div>

  <!-- グローバルメッセージシステム -->
  <ToastMessage />
  <ConfirmDialog />
</template>

<style scoped>
/* アプリケーション全体のスタイリング */
#app {
  min-height: 100vh;
}

/* カードホバーエフェクト */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* ボタンホバーエフェクト */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .container-fluid {
    padding-left: 15px;
    padding-right: 15px;
  }
}
</style>
