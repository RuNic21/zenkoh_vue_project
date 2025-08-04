<script setup>
// 必要なコンポーネントをインポートします
import HelloWorld from "./components/HelloWorld.vue";
import TheWelcome from "./components/TheWelcome.vue";
</script>

<template>
  <!-- ヘッダーセクション -->
  <header>
    <!-- Vueロゴ画像 -->
    <img
      alt="Vue logo"
      class="logo"
      src="./assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <!-- HelloWorldコンポーネントに日本語メッセージを渡す -->
      <HelloWorld msg="お疲れ様でした！" />
    </div>
  </header>

  <!-- メインコンテンツエリア -->
  <main>
    <TheWelcome />
  </main>
</template>

<style scoped>
/* ヘッダースタイリング */
header {
  line-height: 1.5;
}

/* ロゴスタイリング */
.logo {
  display: block;
  margin: 0 auto 2rem;
}

/* デスクトップ画面でのレスポンシブスタイリング */
@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
