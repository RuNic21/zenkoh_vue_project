<script setup>
// 必要なコンポーネントをインポートします
import WelcomeItem from "./WelcomeItem.vue";
import DocumentationIcon from "./icons/IconDocumentation.vue";
import ToolingIcon from "./icons/IconTooling.vue";
import EcosystemIcon from "./icons/IconEcosystem.vue";
import CommunityIcon from "./icons/IconCommunity.vue";
import SupportIcon from "./icons/IconSupport.vue";

// READMEファイルをエディターで開く
const openReadmeInEditor = () => fetch("/__open-in-editor?file=README.md");
</script>

<template>
  <!-- ドキュメントセクション -->
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>ドキュメント</template>

    Vueの
    <a href="https://vuejs.org/" target="_blank" rel="noopener"
      >公式ドキュメント</a
    >
    で、開発に必要なすべての情報を確認できます。
  </WelcomeItem>

  <!-- ツールセクション -->
  <WelcomeItem>
    <template #icon>
      <ToolingIcon />
    </template>
    <template #heading>開発ツール</template>

    このプロジェクトは
    <a
      href="https://vite.dev/guide/features.html"
      target="_blank"
      rel="noopener"
      >Vite</a
    >で 配信・バンドルされています。推奨IDEは
    <a href="https://code.visualstudio.com/" target="_blank" rel="noopener"
      >VSCode</a
    >
    +
    <a
      href="https://github.com/vuejs/language-tools"
      target="_blank"
      rel="noopener"
      >Vue - Official</a
    >です。 コンポーネントとウェブページのテストには
    <a href="https://vitest.dev/" target="_blank" rel="noopener">Vitest</a>
    と
    <a href="https://www.cypress.io/" target="_blank" rel="noopener">Cypress</a>
    /
    <a href="https://playwright.dev/" target="_blank" rel="noopener"
      >Playwright</a
    >
    をお勧めします。

    <br />

    詳細な手順は
    <a href="javascript:void(0)" @click="openReadmeInEditor"
      ><code>README.md</code></a
    >
    で確認できます。
  </WelcomeItem>

  <!-- エコシステムセクション -->
  <WelcomeItem>
    <template #icon>
      <EcosystemIcon />
    </template>
    <template #heading>エコシステム</template>

    プロジェクト用の公式ツールとライブラリを入手：
    <a href="https://pinia.vuejs.org/" target="_blank" rel="noopener">Pinia</a
    >、
    <a href="https://router.vuejs.org/" target="_blank" rel="noopener"
      >Vue Router</a
    >、
    <a href="https://test-utils.vuejs.org/" target="_blank" rel="noopener"
      >Vue Test Utils</a
    >、
    <a href="https://github.com/vuejs/devtools" target="_blank" rel="noopener"
      >Vue Dev Tools</a
    >。 より多くのリソースが必要な場合は
    <a
      href="https://github.com/vuejs/awesome-vue"
      target="_blank"
      rel="noopener"
      >Awesome Vue</a
    >
    をご覧ください。
  </WelcomeItem>

  <!-- コミュニティセクション -->
  <WelcomeItem>
    <template #icon>
      <CommunityIcon />
    </template>
    <template #heading>コミュニティ</template>

    困ったことがありますか？
    <a href="https://chat.vuejs.org" target="_blank" rel="noopener">Vue Land</a>
    （公式Discordサーバー）で質問するか、
    <a
      href="https://stackoverflow.com/questions/tagged/vue.js"
      target="_blank"
      rel="noopener"
      >StackOverflow</a
    >
    をご利用ください。最新のVueニュースは公式
    <a href="https://bsky.app/profile/vuejs.org" target="_blank" rel="noopener"
      >@vuejs.org</a
    >
    Blueskyアカウントまたは
    <a href="https://x.com/vuejs" target="_blank" rel="noopener">@vuejs</a>
    Xアカウントをフォローしてください。
  </WelcomeItem>

  <!-- サポートセクション -->
  <WelcomeItem>
    <template #icon>
      <SupportIcon />
    </template>
    <template #heading>Vueをサポート</template>

    独立したプロジェクトとして、Vueは持続可能性のためにコミュニティの支援に依存しています。
    <a href="https://vuejs.org/sponsor/" target="_blank" rel="noopener"
      >スポンサーになる</a
    >
    ことで支援できます。
  </WelcomeItem>
</template>
