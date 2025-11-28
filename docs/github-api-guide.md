# GitHub API 連携ガイド

## 📋 概要

Zenkoh Project Scheduler で GitHub API を使用してリポジトリ、コミット、イシュー、プルリクエストなどの情報を取得する方法を説明します。

## 🚀 クイックスタート

### 1. 環境変数設定

`.env.local` ファイルに GitHub トークンを追加します（オプション）。

```bash
# GitHub Personal Access Token（オプション）
# トークンなしでも一部のAPIは利用可能ですが、レート制限が厳しくなります
VITE_GITHUB_TOKEN=your_github_personal_access_token_here
```

#### GitHub Personal Access Token の取得方法

1. GitHub にログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token" をクリック
4. 必要なスコープを選択（例: `repo`, `read:org`）
5. トークンをコピーして `.env.local` に設定

**注意**: トークンは機密情報なので、`.env.local` を Git にコミットしないでください。

### 2. 基本的な使用方法

#### リポジトリ情報を取得

```typescript
import { getRepository } from "@/services/githubService";

// Vue コンポーネント内
const loadRepo = async () => {
  const result = await getRepository("vuejs", "vue");
  if (result.success && result.data) {
    console.log("リポジトリ名:", result.data.name);
    console.log("説明:", result.data.description);
    console.log("スター数:", result.data.stargazers_count);
  } else {
    console.error("エラー:", result.error);
  }
};
```

#### ユーザーのリポジトリ一覧を取得

```typescript
import { getUserRepositories } from "@/services/githubService";

const loadUserRepos = async () => {
  const result = await getUserRepositories("octocat");
  if (result.success && result.data) {
    result.data.forEach((repo) => {
      console.log(repo.name, repo.stargazers_count);
    });
  }
};
```

#### コミット一覧を取得

```typescript
import { getRepositoryCommits } from "@/services/githubService";

const loadCommits = async () => {
  const result = await getRepositoryCommits("vuejs", "vue", {
    per_page: 10,
    page: 1,
  });
  if (result.success && result.data) {
    result.data.forEach((commit) => {
      console.log(commit.commit.message);
    });
  }
};
```

#### イシュー一覧を取得

```typescript
import { getRepositoryIssues } from "@/services/githubService";

const loadIssues = async () => {
  const result = await getRepositoryIssues("vuejs", "vue", "open");
  if (result.success && result.data) {
    result.data.forEach((issue) => {
      console.log(`#${issue.number}: ${issue.title}`);
    });
  }
};
```

#### プルリクエスト一覧を取得

```typescript
import { getRepositoryPullRequests } from "@/services/githubService";

const loadPRs = async () => {
  const result = await getRepositoryPullRequests("vuejs", "vue", "open");
  if (result.success && result.data) {
    result.data.forEach((pr) => {
      console.log(`PR #${pr.number}: ${pr.title}`);
    });
  }
};
```

#### リポジトリを検索

```typescript
import { searchRepositories } from "@/services/githubService";

const searchRepos = async () => {
  const result = await searchRepositories({
    query: "vue language:typescript",
    sort: "stars",
    order: "desc",
    per_page: 10,
  });
  if (result.success && result.data) {
    console.log(`検索結果: ${result.data.total_count}件`);
    result.data.items.forEach((repo) => {
      console.log(repo.full_name);
    });
  }
};
```

### 3. 接続テスト

```typescript
import { testGitHubConnection } from "@/services/githubService";

const testConnection = async () => {
  const result = await testGitHubConnection();
  if (result.success && result.data) {
    console.log("認証状態:", result.data.authenticated ? "認証済み" : "未認証");
    console.log("残りレート制限:", result.data.rate_limit);
  }
};
```

## 📚 利用可能な関数一覧

### リポジトリ関連
- `getRepository(owner, repo)` - リポジトリ情報を取得
- `getUserRepositories(username, type, sort, direction)` - ユーザーのリポジトリ一覧
- `searchRepositories(params)` - リポジトリを検索

### コミット関連
- `getRepositoryCommits(owner, repo, params)` - コミット一覧を取得
- `getCommit(owner, repo, sha)` - 特定のコミット情報を取得

### イシュー関連
- `getRepositoryIssues(owner, repo, state, labels)` - イシュー一覧を取得
- `getIssue(owner, repo, issueNumber)` - 特定のイシュー情報を取得

### プルリクエスト関連
- `getRepositoryPullRequests(owner, repo, state)` - プルリクエスト一覧を取得
- `getPullRequest(owner, repo, pullNumber)` - 特定のプルリクエスト情報を取得

### ブランチ関連
- `getRepositoryBranches(owner, repo)` - ブランチ一覧を取得

### ユーティリティ
- `testGitHubConnection()` - GitHub API 接続テスト

## 🔒 レート制限について

GitHub API にはレート制限があります：

- **認証なし**: 1時間あたり 60 リクエスト
- **認証あり**: 1時間あたり 5,000 リクエスト

トークンを設定することで、より多くのリクエストが可能になります。

## 🎯 実装例: Vue コンポーネント

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getRepository, type GitHubRepository } from "@/services/githubService";

const repository = ref<GitHubRepository | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const loadRepository = async () => {
  isLoading.value = true;
  error.value = null;

  const result = await getRepository("vuejs", "vue");
  
  if (result.success && result.data) {
    repository.value = result.data;
  } else {
    error.value = result.error || "リポジトリ情報の取得に失敗しました";
  }

  isLoading.value = false;
};

onMounted(() => {
  loadRepository();
});
</script>

<template>
  <div class="github-repo-container">
    <div v-if="isLoading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="repository" class="repo-info">
      <h3>{{ repository.name }}</h3>
      <p>{{ repository.description }}</p>
      <div class="stats">
        <span>⭐ {{ repository.stargazers_count }}</span>
        <span>🍴 {{ repository.forks_count }}</span>
        <span>🐛 {{ repository.open_issues_count }}</span>
      </div>
      <a :href="repository.html_url" target="_blank">GitHub で開く</a>
    </div>
  </div>
</template>

<style scoped>
.github-repo-container {
  padding: 20px;
}

.repo-info {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}

.stats {
  display: flex;
  gap: 16px;
  margin: 12px 0;
}

.error {
  color: red;
}
</style>
```

## 📖 参考リンク

- [GitHub REST API ドキュメント](https://docs.github.com/en/rest)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

