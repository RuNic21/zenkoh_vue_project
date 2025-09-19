<script setup>
// プロジェクト管理スケジューラー: メインアプリケーションコンポーネント
import { ref, computed, onMounted, watch } from "vue";
import MainLayout from "./layouts/MainLayout.vue";
import ScheduleList from "./pages/ScheduleList.vue";
import ScheduleDetail from "./pages/ScheduleDetail.vue";

// 現在のページを管理するリアクティブデータ
const currentPage = ref("dashboard");

// ページ切り替えメソッド
const navigateToPage = (pageName) => {
  currentPage.value = pageName;
};

// 現在のページコンポーネントを計算
const currentComponent = computed(() => {
  switch (currentPage.value) {
    case "schedule-list":
      return ScheduleList;
    case "schedule-detail":
      return ScheduleDetail;
    default:
      return null;
  }
});

// アプリケーション初期化
onMounted(() => {
  console.log("プロジェクト管理スケジューラーが起動しました");
});
</script>

<template>
  <!-- メインレイアウトコンテナ -->
  <div id="app" class="g-sidenav-show bg-gray-100">
    <!-- メインレイアウトコンポーネント -->
    <MainLayout 
      :current-page="currentPage"
      @navigate="navigateToPage"
    >
      <!-- 動的コンテンツエリア -->
      <div class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
        <!-- ナビゲーションバー -->
        <nav class="navbar navbar-main navbar-expand-lg px-0 mx-3 shadow-none border-radius-xl" id="navbarBlur" data-scroll="true">
          <div class="container-fluid py-1 px-3">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
                <li class="breadcrumb-item text-sm">
                  <a class="opacity-5 text-dark" href="javascript:;">ページ</a>
                </li>
                <li class="breadcrumb-item text-sm text-dark active" aria-current="page">
                  {{ currentPage === 'dashboard' ? 'ダッシュボード' : 'スケジュール管理' }}
                </li>
              </ol>
            </nav>
            <div class="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
              <div class="ms-md-auto pe-md-3 d-flex align-items-center">
                <div class="input-group input-group-outline">
                  <label class="form-label">検索...</label>
                  <input type="text" class="form-control" placeholder="プロジェクトやタスクを検索">
                </div>
              </div>
              <ul class="navbar-nav d-flex align-items-center justify-content-end">
                <li class="nav-item px-3 d-flex align-items-center">
                  <a href="javascript:;" class="nav-link text-body p-0">
                    <i class="material-symbols-rounded fixed-plugin-button-nav">settings</i>
                  </a>
                </li>
                <li class="nav-item dropdown pe-3 d-flex align-items-center">
                  <a href="javascript:;" class="nav-link text-body p-0" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="material-symbols-rounded">notifications</i>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end px-2 py-3 me-sm-n4" aria-labelledby="dropdownMenuButton">
                    <li class="mb-2">
                      <a class="dropdown-item border-radius-md" href="javascript:;">
                        <div class="d-flex py-1">
                          <div class="my-auto">
                            <div class="avatar avatar-sm bg-gradient-primary me-3">
                              <i class="material-symbols-rounded text-white">schedule</i>
                            </div>
                          </div>
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

        <!-- メインコンテンツエリア -->
        <div class="container-fluid py-4">
          <!-- ダッシュボードページ -->
          <div v-if="currentPage === 'dashboard'">
            <!-- ページヘッダー -->
            <div class="row mb-4">
              <div class="col-12">
                <div class="ms-3">
                  <h3 class="mb-0 h4 font-weight-bolder">プロジェクト管理ダッシュボード</h3>
                  <p class="mb-4">
                    プロジェクトの進捗状況とスケジュールを一覧で確認できます。
                  </p>
                </div>
              </div>
            </div>

            <!-- 統計カード -->
            <div class="row mb-4">
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">進行中プロジェクト</p>
                        <h4 class="mb-0">12</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">work</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">+2</span> 今週追加
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">今週のタスク</p>
                        <h4 class="mb-0">28</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-success shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">task</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">+5</span> 昨日から
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">完了率</p>
                        <h4 class="mb-0">85%</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">trending_up</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">+3%</span> 先週から
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-xl-3 col-sm-6">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">期限切れ</p>
                        <h4 class="mb-0">3</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-warning shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">warning</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-danger font-weight-bolder">注意が必要</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- クイックアクションとアクティビティ -->
            <div class="row">
              <!-- クイックアクションカード -->
              <div class="col-lg-8 col-md-6 mb-4">
                <div class="card">
                  <div class="card-header pb-0">
                    <div class="row">
                      <div class="col-lg-6 col-7">
                        <h6>クイックアクション</h6>
                        <p class="text-sm mb-0">
                          <i class="fa fa-plus text-info" aria-hidden="true"></i>
                          <span class="font-weight-bold ms-1">新しいプロジェクト</span>を作成
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <div class="row p-3">
                      <div class="col-md-6 mb-3">
                        <button 
                          class="btn btn-outline-primary w-100"
                          @click="navigateToPage('schedule-list')"
                        >
                          <i class="material-symbols-rounded me-2">schedule</i>
                          スケジュール一覧
                        </button>
                      </div>
                      <div class="col-md-6 mb-3">
                        <button class="btn btn-outline-success w-100">
                          <i class="material-symbols-rounded me-2">add</i>
                          新しいプロジェクト
                        </button>
                      </div>
                      <div class="col-md-6 mb-3">
                        <button class="btn btn-outline-info w-100">
                          <i class="material-symbols-rounded me-2">task</i>
                          タスク管理
                        </button>
                      </div>
                      <div class="col-md-6 mb-3">
                        <button class="btn btn-outline-warning w-100">
                          <i class="material-symbols-rounded me-2">analytics</i>
                          レポート
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 最近のアクティビティ -->
              <div class="col-lg-4 col-md-6">
                <div class="card h-100">
                  <div class="card-header pb-0">
                    <h6>最近のアクティビティ</h6>
                    <p class="text-sm">
                      <i class="fa fa-clock text-info" aria-hidden="true"></i>
                      <span class="font-weight-bold">リアルタイム</span>更新
                    </p>
                  </div>
                  <div class="card-body p-3">
                    <div class="timeline timeline-one-side">
                      <div class="timeline-block mb-3">
                        <span class="timeline-step">
                          <i class="material-symbols-rounded text-success text-gradient">check_circle</i>
                        </span>
                        <div class="timeline-content">
                          <h6 class="text-dark text-sm font-weight-bold mb-0">プロジェクトA完了</h6>
                          <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">2時間前</p>
                        </div>
                      </div>
                      <div class="timeline-block mb-3">
                        <span class="timeline-step">
                          <i class="material-symbols-rounded text-primary text-gradient">add</i>
                        </span>
                        <div class="timeline-content">
                          <h6 class="text-dark text-sm font-weight-bold mb-0">新しいタスク追加</h6>
                          <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">4時間前</p>
                        </div>
                      </div>
                      <div class="timeline-block mb-3">
                        <span class="timeline-step">
                          <i class="material-symbols-rounded text-warning text-gradient">schedule</i>
                        </span>
                        <div class="timeline-content">
                          <h6 class="text-dark text-sm font-weight-bold mb-0">スケジュール更新</h6>
                          <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">1日前</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 動的コンポーネント表示 -->
          <component v-else :is="currentComponent" />
        </div>
      </div>
    </MainLayout>
  </div>
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
