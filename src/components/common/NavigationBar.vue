<script setup lang="ts">
// ナビゲーションバーコンポーネント: ページタイトル・検索・通知・設定を表示
import { computed } from "vue";

// Props 定義
interface Props {
  currentPage: string;
  searchQuery: string;
}

const props = defineProps<Props>();

// Emits 定義
const emit = defineEmits<{
  "update:searchQuery": [value: string];
}>();

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
    default:
      return "スケジュール管理";
  }
});

// 検索クエリ更新ハンドラ
const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:searchQuery", target.value);
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
        <!-- 検索フォーム -->
        <div class="ms-md-auto pe-md-3 d-flex align-items-center">
          <div class="input-group input-group-outline">
            <label class="form-label"></label>
            <input
              type="text"
              class="form-control"
              placeholder="プロジェクトや担当者を検索してください"
              :value="searchQuery"
              @input="handleSearchInput"
            />
          </div>
        </div>

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
              class="nav-link text-body p-0"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="material-symbols-rounded">notifications</i>
            </a>
            <ul
              class="dropdown-menu dropdown-menu-end px-2 py-3 me-sm-n4"
              aria-labelledby="dropdownMenuButton"
            >
              <li class="mb-2">
                <a class="dropdown-item border-radius-md" href="javascript:;">
                  <div class="d-flex py-1">
                    <div class="my-auto">
                      <div class="avatar avatar-sm bg-gradient-primary me-3">
                        <i class="material-symbols-rounded text-white">schedule</i>
                      </div>
                    </div>
                    <!-- ダミーデータ -->
                    <div class="d-flex flex-column justify-content-center">
                      <h6 class="text-sm font-weight-normal mb-1">
                        <span class="font-weight-bold">新しいスケジュール</span>が追加されました
                      </h6>
                      <p class="text-xs text-secondary mb-0">
                        <i class="fa fa-clock me-1"></i>
                        5分前
                      </p>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </li>

          <!-- ユーザーアイコン -->
          <li class="nav-item d-flex align-items-center">
            <a href="javascript:;" class="nav-link text-body font-weight-bold px-0">
              <i class="material-symbols-rounded">account_circle</i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <!-- ナビゲーションバー終了 -->
</template>

<style scoped>
/* ナビゲーションバー固有のスタイルは Material Dashboard のデフォルトを使用 */
</style>

