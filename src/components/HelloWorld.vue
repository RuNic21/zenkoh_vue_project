<script setup>
// props定義: 親コンポーネントからメッセージを受け取ります
defineProps({
  msg: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <!-- 歓迎メッセージセクション -->
  <div class="greetings">
    <!-- メインメッセージ表示 -->
    <h1 class="green">{{ msg }}</h1>
    <!-- プロジェクト情報案内 -->
    <h3>
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>で
      プロジェクトが正常に作成されました。
    </h3>
    <!-- 追加日本語メッセージ -->
    <p class="subtitle">開発を開始する準備が整いました！</p>
  </div>
</template>

<style scoped>
/* メインタイトルスタイリング */
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

/* サブタイトルスタイリング */
h3 {
  font-size: 1.2rem;
}

/* 追加メッセージスタイリング */
.subtitle {
  font-size: 1rem;
  color: #666;
  margin-top: 1rem;
  text-align: center;
}

/* モバイルでの中央揃え */
.greetings h1,
.greetings h3 {
  text-align: center;
}

/* デスクトップでの左揃え */
@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }

  .subtitle {
    text-align: left;
  }
}
</style>
