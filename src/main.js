// Vueアプリケーションのメインエントリーポイント
// Material Dashboard CSSをインポートします
import "./assets/css/material-dashboard.css";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";

// Vue 3のcreateApp関数をインポートします
import { createApp } from "vue";
// ルートコンポーネントであるApp.vueをインポートします
import App from "./App.vue";
// Vue Routerをインポートします
import router from "./router";
// 認証システムの初期化関数をインポート
import { initializeAuthSystem } from "./composables/useAuth";

// Vueアプリケーションを作成
const app = createApp(App);

// Routerをアプリケーションに登録
app.use(router);

// 認証システムを初期化してから、DOMにマウント
initializeAuthSystem().then(() => {
  // DOMにマウント
  app.mount("#app");
  console.log("アプリケーションが起動しました（認証システム統合版）");
}).catch((error) => {
  console.error("認証システムの初期化に失敗:", error);
  // エラーが発生しても、アプリケーションは起動
  app.mount("#app");
});
