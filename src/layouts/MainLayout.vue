<script setup lang="ts">
// メインレイアウトコンポーネント: プロジェクト管理スケジューラーの基本レイアウト
import { ref, computed, watch } from "vue";

// NavigationItem インターフェース定義
interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

// Props インターフェース定義
interface Props {
  currentPage: string;
}

// props定義: 親コンポーネントから受け取るデータ
const props = withDefaults(defineProps<Props>(), {
  currentPage: "dashboard"
});

// emit定義: 親コンポーネントにイベントを送信
const emit = defineEmits<{
  navigate: [pageId: string];
}>();

// サイドバーの開閉状態を管理
const isSidebarOpen = ref(true);

// ナビゲーションメニューアイテム
const navigationItems = ref<NavigationItem[]>([
  {
    id: "dashboard",
    name: "ダッシュボード",
    icon: "dashboard",
    isActive: true
  },
  {
    id: "project-management",
    name: "プロジェクト管理",
    icon: "work",
    isActive: false
  },
  {
    id: "schedule-list",
    name: "タスク管理",
    icon: "schedule",
    isActive: false
  },
  {
    id: "team",
    name: "チーム管理",
    icon: "group",
    isActive: false
  },
  {
    id: "report",
    name: "レポート",
    icon: "assessment",
    isActive: false
  }
]);

// 現在のページに基づいてアクティブなメニューを更新
const updateActiveMenu = (pageId: string) => {
  navigationItems.value.forEach(item => {
    item.isActive = item.id === pageId;
  });
};

// ナビゲーション処理
const handleNavigation = (pageId: string) => {
  updateActiveMenu(pageId);
  emit('navigate', pageId);
};

// サイドバーの開閉切り替え
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// 現在のページが変更されたときにメニューを更新
watch(() => props.currentPage, (newPage) => {
  updateActiveMenu(newPage);
}, { immediate: true });
</script>

<template>
  <!-- メインレイアウトコンテナ -->
  <div class="main-layout">
    <!-- サイドバー -->
    <aside 
      class="sidenav navbar navbar-vertical navbar-expand-xs border-radius-lg fixed-start ms-2 bg-white my-2" 
      id="sidenav-main"
      :class="{ 'sidenav-hidden': !isSidebarOpen }"
    >
      <!-- サイドバーヘッダー -->
      <div class="sidenav-header">
        <i 
          class="fas fa-times p-3 cursor-pointer text-dark opacity-5 position-absolute end-0 top-0 d-none d-xl-none" 
          aria-hidden="true" 
          id="iconSidenav"
          @click="toggleSidebar"
        ></i>
        <a class="navbar-brand px-4 py-3 m-0" href="javascript:;">
          <div class="d-flex align-items-center">
            <div class="icon icon-shape icon-sm bg-gradient-primary shadow text-center border-radius-lg">
              <i class="material-symbols-rounded text-white opacity-10">schedule</i>
            </div>
            <span class="ms-2 text-sm text-dark font-weight-bold">プロジェクト管理</span>
          </div>
        </a>
      </div>
      
      <hr class="horizontal dark mt-0 mb-2">
      
      <!-- ナビゲーションメニュー -->
      <div class="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
        <ul class="navbar-nav">
          <li 
            v-for="item in navigationItems" 
            :key="item.id" 
            class="nav-item"
          >
            <a 
              class="nav-link text-dark"
              :class="{ 'active bg-gradient-primary text-white': item.isActive }"
              href="javascript:;"
              @click="handleNavigation(item.id)"
            >
              <i class="material-symbols-rounded opacity-5">{{ item.icon }}</i>
              <span class="nav-link-text ms-1">{{ item.name }}</span>
            </a>
          </li>
        </ul>
      </div>
      
      <!-- サイドバーフッター -->
      <div class="sidenav-footer position-absolute w-100 bottom-0">
        <div class="mx-3">
          <button 
            class="btn btn-outline-primary mt-4 w-100"
            @click="handleNavigation('settings')"
          >
            <i class="material-symbols-rounded me-2">settings</i>
            設定
          </button>
          <button 
            class="btn bg-gradient-primary w-100 mt-2"
            @click="handleNavigation('help')"
          >
            <i class="material-symbols-rounded me-2">help</i>
            ヘルプ
          </button>
        </div>
      </div>
    </aside>

    <!-- メインコンテンツエリア -->
    <main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
      <!-- スロットコンテンツを表示 -->
      <slot />
    </main>

    <!-- モバイル用サイドバートグルボタン -->
    <div class="d-xl-none">
      <button 
        class="btn btn-primary position-fixed top-0 start-0 m-3"
        @click="toggleSidebar"
        style="z-index: 1000;"
      >
        <i class="material-symbols-rounded">menu</i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* メインレイアウトのスタイリング */
.main-layout {
  min-height: 100vh;
  position: relative;
}

/* サイドバーのスタイリング */
.sidenav {
  transition: all 0.3s ease-in-out;
  z-index: 1000;
}

.sidenav-hidden {
  transform: translateX(-100%);
}

/* ナビゲーションリンクのスタイリング */
.nav-link {
  transition: all 0.2s ease-in-out;
  border-radius: 0.5rem;
  margin: 0.25rem 0.5rem;
}

.nav-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateX(2px);
}

.nav-link.active {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* アイコンのスタイリング */
.material-symbols-rounded {
  font-size: 1.2rem;
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* レスポンシブデザイン */
@media (max-width: 1200px) {
  .sidenav {
    transform: translateX(-100%);
  }
  
  .sidenav.show {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .sidenav {
    width: 280px;
  }
  
  .main-content {
    margin-left: 0 !important;
  }
}

/* アニメーション */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.sidenav {
  animation: slideIn 0.3s ease-out;
}

/* ホバーエフェクト */
.navbar-brand:hover {
  transform: scale(1.02);
}

/* アクティブ状態のスタイリング */
.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 0 2px 2px 0;
}
</style>
