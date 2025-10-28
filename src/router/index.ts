// Vue Router 設定ファイル
// 目的: アプリケーション全体のルーティングを管理

import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

// ページコンポーネントをインポート（Lazy Loading対応）
const DashboardPage = () => import("@/pages/DashboardPage.vue");
const ScheduleList = () => import("@/pages/ScheduleList.vue");
const ScheduleDetail = () => import("@/pages/ScheduleDetail.vue");
const ProjectManagement = () => import("@/pages/ProjectManagement.vue");
const ProjectDetail = () => import("@/pages/ProjectDetail.vue");
const TeamManagement = () => import("@/pages/TeamManagement.vue");
const ReportPage = () => import("@/pages/ReportPage.vue");
// 認証ページ
const LoginPage = () => import("@/pages/LoginPage.vue");
const SignUpPage = () => import("@/pages/SignUpPage.vue");

// ルート定義
const routes: RouteRecordRaw[] = [
  // 認証不要ページ
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: {
      title: "ログイン",
      requiresAuth: false,
    },
  },
  {
    path: "/signup",
    name: "signup",
    component: SignUpPage,
    meta: {
      title: "会員登録",
      requiresAuth: false,
    },
  },
  
  // 認証必要ページ
  {
    path: "/",
    name: "dashboard",
    component: DashboardPage,
    meta: {
      title: "ダッシュボード",
      requiresAuth: true,
    },
  },
  {
    path: "/projects",
    name: "project-management",
    component: ProjectManagement,
    meta: {
      title: "プロジェクト管理",
      requiresAuth: true,
    },
  },
  {
    path: "/projects/:id",
    name: "project-detail",
    component: ProjectDetail,
    meta: {
      title: "プロジェクト詳細",
      requiresAuth: true,
    },
    props: true, // ルートパラメータを props として渡す
  },
  {
    path: "/tasks",
    name: "schedule-list",
    component: ScheduleList,
    meta: {
      title: "タスク管理",
      requiresAuth: true,
    },
  },
  {
    path: "/tasks/:id",
    name: "schedule-detail",
    component: ScheduleDetail,
    meta: {
      title: "タスク詳細",
      requiresAuth: true,
    },
    props: true,
  },
  {
    path: "/team",
    name: "team",
    component: TeamManagement,
    meta: {
      title: "チーム管理",
      requiresAuth: true,
    },
  },
  {
    path: "/reports",
    name: "report",
    component: ReportPage,
    meta: {
      title: "レポート",
      requiresAuth: true,
    },
  },
  // 404 Not Found ページ（オプション）
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    redirect: "/",
  },
];

// ルーター作成
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // スクロール位置の制御（ページ遷移時にトップに戻る）
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// ナビゲーションガード（グローバル）
router.beforeEach(async (to, from, next) => {
  // ページタイトルを動的に設定
  if (to.meta.title) {
    document.title = `${to.meta.title} | Zenkoh Project Scheduler`;
  } else {
    document.title = "Zenkoh Project Scheduler";
  }

  // 認証チェック
  if (to.meta.requiresAuth) {
    // 認証サービスから現在のセッションを取得
    const { getCurrentSession } = await import("@/services/authService");
    const result = await getCurrentSession();

    if (!result.success || !result.data) {
      // 認証されていない場合、ログインページへリダイレクト
      console.log("認証が必要です。ログインページへリダイレクトします");
      next({
        name: "login",
        query: { redirect: to.fullPath }, // 元のページをクエリパラメータで保存
      });
      return;
    }
  }

  // ログイン済みユーザーがログインページにアクセスした場合、ダッシュボードへリダイレクト
  if (to.name === "login" || to.name === "signup") {
    const { getCurrentSession } = await import("@/services/authService");
    const result = await getCurrentSession();

    if (result.success && result.data) {
      console.log("すでにログイン済みです。ダッシュボードへリダイレクトします");
      next({ name: "dashboard" });
      return;
    }
  }

  next();
});

// ナビゲーション後のフック（ローディング処理など）
router.afterEach((to, from) => {
  // ページビューのトラッキング（アナリティクス実装時に使用）
  console.log(`ナビゲーション: ${from.path} → ${to.path}`);
});

export default router;

