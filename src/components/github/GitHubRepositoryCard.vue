<!-- GitHub リポジトリ情報を表示するカードコンポーネント -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getRepository } from "@/services/githubService";
import type { GitHubRepository } from "@/types/github";

// Props: リポジトリオーナーとリポジトリ名を受け取る
interface Props {
	owner: string;
	repo: string;
}

const props = defineProps<Props>();

// 状態管理
const repository = ref<GitHubRepository | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// リポジトリ情報を読み込む
const loadRepository = async () => {
	isLoading.value = true;
	error.value = null;

	const result = await getRepository(props.owner, props.repo);

	if (result.success && result.data) {
		repository.value = result.data;
	} else {
		error.value = result.error || "リポジトリ情報の取得に失敗しました";
	}

	isLoading.value = false;
};

// コンポーネントマウント時にデータを読み込む
onMounted(() => {
	loadRepository();
});
</script>

<template>
	<div class="github-repo-card">
		<!-- 読み込み中 -->
		<div v-if="isLoading" class="loading">
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">読み込み中...</span>
			</div>
			<span class="ms-2">読み込み中...</span>
		</div>

		<!-- エラー表示 -->
		<div v-else-if="error" class="alert alert-danger" role="alert">
			<strong>エラー:</strong> {{ error }}
		</div>

		<!-- リポジトリ情報表示 -->
		<div v-else-if="repository" class="repo-content">
			<div class="repo-header">
				<h5 class="repo-name">
					<a :href="repository.html_url" target="_blank" rel="noopener noreferrer">
						{{ repository.full_name }}
					</a>
				</h5>
				<span v-if="repository.private" class="badge bg-secondary">Private</span>
				<span v-else class="badge bg-success">Public</span>
			</div>

			<p v-if="repository.description" class="repo-description">
				{{ repository.description }}
			</p>

			<div class="repo-stats">
				<div class="stat-item">
					<i class="fas fa-star"></i>
					<span>{{ repository.stargazers_count.toLocaleString() }}</span>
				</div>
				<div class="stat-item">
					<i class="fas fa-code-branch"></i>
					<span>{{ repository.forks_count.toLocaleString() }}</span>
				</div>
				<div v-if="repository.open_issues_count > 0" class="stat-item">
					<i class="fas fa-exclamation-circle"></i>
					<span>{{ repository.open_issues_count.toLocaleString() }}</span>
				</div>
				<div v-if="repository.language" class="stat-item">
					<span class="language-dot"></span>
					<span>{{ repository.language }}</span>
				</div>
			</div>

			<div class="repo-footer">
				<small class="text-muted">
					最終更新: {{ new Date(repository.updated_at).toLocaleDateString("ja-JP") }}
				</small>
			</div>
		</div>
	</div>
</template>

<style scoped>
.github-repo-card {
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 16px;
	background-color: #fff;
	transition: box-shadow 0.2s;
}

.github-repo-card:hover {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
}

.repo-content {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.repo-header {
	display: flex;
	align-items: center;
	gap: 8px;
}

.repo-name {
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
}

.repo-name a {
	color: #1976d2;
	text-decoration: none;
}

.repo-name a:hover {
	text-decoration: underline;
}

.repo-description {
	margin: 0;
	color: #666;
	font-size: 0.9rem;
	line-height: 1.5;
}

.repo-stats {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.9rem;
	color: #666;
}

.stat-item i {
	color: #999;
}

.language-dot {
	display: inline-block;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: #1976d2;
}

.repo-footer {
	margin-top: auto;
	padding-top: 8px;
	border-top: 1px solid #e0e0e0;
}
</style>

