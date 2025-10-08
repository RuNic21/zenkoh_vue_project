<script setup lang="ts">
// プロジェクト管理スケジューラー: メインアプリケーションコンポーネント
import { ref, computed, onMounted, watch } from "vue";
import { useScheduleStore } from "./store/schedule";
import { getStatusBadgeClass, getProgressBarClass } from "./utils/uiHelpers";
import MainLayout from "./layouts/MainLayout.vue";
import ScheduleList from "./pages/ScheduleList.vue";
import ScheduleDetail from "./pages/ScheduleDetail.vue";
// Supabase クライアント（ダッシュボード一覧をDBから取得するために使用）
import { supabase } from "./services/supabaseClient";

// 現在のページを管理するリアクティブデータ
const currentPage = ref("dashboard");
// 共有ストアを初期化
const store = useScheduleStore();

// ページ切り替えメソッド
const navigateToPage = (pageName: string) => {
  currentPage.value = pageName;
};

// ダッシュボードの「詳細を見る」クリック時の処理
// 目的: プロジェクト名から該当スケジュールを推測して選択→詳細へ
const handleViewProjectDetail = (project: ProjectProgressRow) => {
  try {
    const list = store.schedules.value || [];
    const target = list.find((s) => typeof s.title === "string" && s.title.startsWith(project.name));
    if (target) {
      store.selectSchedule(target.id);
      return;
    }
    // 一致が無ければページのみ遷移
    currentPage.value = "schedule-detail";
  } catch (e) {
    console.error("詳細遷移に失敗しました", e);
    currentPage.value = "schedule-detail";
  }
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

// ダッシュボード表示用: DB の projects / tasks / users を用いて進捗一覧を構築
// 仕様: 進捗 = 同一プロジェクトの tasks.progress_percent の平均（小数点四捨五入）
//       担当者 = projects.owner_user_id に紐づく users.display_name（無ければ "-"）
//       期限 = projects.end_date（無ければ "-"）
interface ProjectProgressRow {
  id: number;
  name: string;
  owner: string;
  progress: number;
  status: string;
  dueDate: string;
}
const projectProgressList = ref<ProjectProgressRow[]>([]);

// DB からダッシュボード用データを読み込む
const loadDashboardFromDb = async (): Promise<void> => {
  try {
    // 1) プロジェクト一覧を取得（最新10件）
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id,name,owner_user_id,end_date")
      .order("id", { ascending: false })
      .limit(10);
    if (projErr) throw new Error(projErr.message);
    const projectIds = (projects ?? []).map((p) => p.id);

    // 2) 対象プロジェクトのタスク進捗をまとめて取得
    const { data: tasks, error: taskErr } = await supabase
      .from("tasks")
      .select("project_id,progress_percent")
      .in("project_id", projectIds.length > 0 ? projectIds : [-1]);
    if (taskErr) throw new Error(taskErr.message);

    // 3) owner ユーザー名を一括取得
    const ownerIds = Array.from(
      new Set((projects ?? []).map((p) => p.owner_user_id).filter((v) => v != null))
    ) as number[];
    let ownersMap: Record<number, string> = {};
    if (ownerIds.length > 0) {
      const { data: owners, error: userErr } = await supabase
        .from("users")
        .select("id,display_name")
        .in("id", ownerIds);
      if (userErr) throw new Error(userErr.message);
      ownersMap = (owners ?? []).reduce((acc, u) => {
        acc[u.id as number] = (u.display_name as string) ?? "-";
        return acc;
      }, {} as Record<number, string>);
    }

    // 4) 集計して表示用配列を構築
    const progressByProject = new Map<number, { sum: number; count: number }>();
    for (const t of tasks ?? []) {
      const key = t.project_id as number;
      const cur = progressByProject.get(key) ?? { sum: 0, count: 0 };
      progressByProject.set(key, { sum: cur.sum + (t.progress_percent as number), count: cur.count + 1 });
    }

    projectProgressList.value = (projects ?? []).map((p) => {
      const agg = progressByProject.get(p.id) ?? { sum: 0, count: 0 };
      const avg = agg.count > 0 ? Math.round(agg.sum / agg.count) : 0;
      const status = avg >= 100 ? "完了" : "進行中";
      const owner = p.owner_user_id != null ? ownersMap[p.owner_user_id as number] ?? "-" : "-";
      const due = p.end_date ? String(p.end_date) : "-";
      return { id: p.id, name: p.name as string, owner, progress: avg, status, dueDate: due };
    });
  } catch (e) {
    console.error("ダッシュボードの読み込みに失敗", e);
    projectProgressList.value = [];
  }
};

// クラス算出ロジックはユーティリティへ集約

// アプリケーション初期化
onMounted(() => {
  console.log("プロジェクト管理スケジューラーが起動しました");
  // 初回ロードでモックデータをロード（将来 Supabase に置換）
  store.loadAll().catch((e) => console.error("初期データの読み込みに失敗", e));
  // ダッシュボードを DB から取得
  loadDashboardFromDb();
});

// ストアでスケジュールが選択されたら詳細ページへ遷移
watch(() => store.selectedScheduleId.value, (id) => {
  if (id != null) {
    currentPage.value = "schedule-detail";
  }
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


          </div>

          <!-- プロジェクト別進捗の一覧表示 -->
          <div v-if="currentPage === 'dashboard'" class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-header pb-0">
                  <div class="row">
                    <div class="col-lg-6 col-8">
                      <h6>プロジェクト別進捗</h6>
                      <p class="text-sm mb-0">
                        <i class="fa fa-chart-line text-info" aria-hidden="true"></i>
                        <span class="font-weight-bold ms-1">主要プロジェクト</span>の進捗状況
                      </p>
                    </div>
                  </div>
                </div>
                <div class="card-body px-0 pt-0 pb-2">
                  <div class="table-responsive p-0">
                    <table class="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">プロジェクト名</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">担当者</th>
                          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗</th>
                          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
                          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">期限</th>
                          <th class="text-secondary opacity-7"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="project in projectProgressList" :key="project.id">
                          <td>
                            <div class="d-flex px-3 py-1">
                              <div class="d-flex flex-column justify-content-center">
                                <h6 class="mb-0 text-sm">{{ project.name }}</h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p class="text-xs font-weight-bold mb-0">{{ project.owner }}</p>
                          </td>
                          <td class="align-middle text-center">
                            <div class="d-flex flex-column align-items-center justify-content-center px-2">
                              <span class="text-xs font-weight-bold mb-1">{{ project.progress }}%</span>
                              <div class="progress w-100" style="max-width:160px;">
                                <div :class="getProgressBarClass(project.progress)" :style="{ width: project.progress + '%' }" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="project.progress"></div>
                              </div>
                            </div>
                          </td>
                          <td class="align-middle text-center">
                            <span :class="getStatusBadgeClass(project.status)">{{ project.status }}</span>
                          </td>
                          <td class="align-middle text-center">
                            <span class="text-secondary text-xs font-weight-normal">{{ project.dueDate }}</span>
                          </td>
                          <td class="align-middle">
                            <button 
                              class="btn btn-sm bg-gradient-primary mb-0" 
                              @click="handleViewProjectDetail(project)"
                            >
                              詳細を見る
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
