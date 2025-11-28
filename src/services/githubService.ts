// GitHub API 連携サービス
// 目的: GitHub REST API を使用してリポジトリ、コミット、イシュー、PR などの情報を取得

import type {
	GitHubRepository,
	GitHubCommit,
	GitHubIssue,
	GitHubPullRequest,
	GitHubBranch,
	GitHubApiResponse,
	GitHubRepositorySearchParams,
	GitHubCommitParams,
} from "../types/github";
import { handleServiceCall, createSuccessResult, createErrorResult, type ServiceResult } from "../utils/errorHandler";

// GitHub API ベースURL
const GITHUB_API_BASE = "https://api.github.com";

// 環境変数から GitHub トークンを取得（オプション: 認証なしでも一部APIは利用可能）
const getGitHubToken = (): string | null => {
	return import.meta.env.VITE_GITHUB_TOKEN || null;
};

// GitHub API リクエスト用のヘッダーを生成
const getGitHubHeaders = (): HeadersInit => {
	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		"Content-Type": "application/json",
	};

	const token = getGitHubToken();
	if (token) {
		headers.Authorization = `token ${token}`;
	}

	return headers;
};

// GitHub API リクエストを実行する共通関数
async function fetchGitHubApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<GitHubApiResponse<T>> {
	try {
		const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
		const response = await fetch(url, {
			...options,
			headers: {
				...getGitHubHeaders(),
				...(options.headers || {}),
			},
		});

		const data = await response.json();

		if (!response.ok) {
			const errorMessage = data.message || `GitHub API エラー: ${response.status}`;
			return {
				data: null,
				error: errorMessage,
				status: response.status,
			};
		}

		return {
			data: data as T,
			error: null,
			status: response.status,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		return {
			data: null,
			error: errorMsg,
			status: 0,
		};
	}
}

// ==================== リポジトリ関連 ====================

/**
 * リポジトリ情報を取得する
 * @param owner リポジトリオーナー（ユーザー名または組織名）
 * @param repo リポジトリ名
 * @returns リポジトリ情報
 */
export async function getRepository(
	owner: string,
	repo: string
): Promise<ServiceResult<GitHubRepository | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchGitHubApi<GitHubRepository>(`/repos/${owner}/${repo}`);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data;
		},
		"リポジトリ情報の取得に失敗しました"
	);
}

/**
 * ユーザーのリポジトリ一覧を取得する
 * @param username ユーザー名
 * @param type リポジトリタイプ（all, owner, member）
 * @param sort ソート方法（created, updated, pushed, full_name）
 * @param direction ソート方向（asc, desc）
 * @returns リポジトリ一覧
 */
export async function getUserRepositories(
	username: string,
	type: "all" | "owner" | "member" = "all",
	sort: "created" | "updated" | "pushed" | "full_name" = "updated",
	direction: "asc" | "desc" = "desc"
): Promise<ServiceResult<GitHubRepository[]>> {
	return handleServiceCall(
		async () => {
			const params = new URLSearchParams({
				type,
				sort,
				direction,
			});
			const response = await fetchGitHubApi<GitHubRepository[]>(
				`/users/${username}/repos?${params.toString()}`
			);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data || [];
		},
		"リポジトリ一覧の取得に失敗しました"
	);
}

/**
 * リポジトリを検索する
 * @param params 検索パラメータ
 * @returns 検索結果
 */
export async function searchRepositories(
	params: GitHubRepositorySearchParams
): Promise<ServiceResult<{ items: GitHubRepository[]; total_count: number }>> {
	return handleServiceCall(
		async () => {
			const searchParams = new URLSearchParams();
			if (params.query) searchParams.append("q", params.query);
			if (params.sort) searchParams.append("sort", params.sort);
			if (params.order) searchParams.append("order", params.order);
			if (params.per_page) searchParams.append("per_page", params.per_page.toString());
			if (params.page) searchParams.append("page", params.page.toString());

			const response = await fetchGitHubApi<{
				total_count: number;
				items: GitHubRepository[];
			}>(`/search/repositories?${searchParams.toString()}`);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data || { items: [], total_count: 0 };
		},
		"リポジトリ検索に失敗しました"
	);
}

// ==================== コミット関連 ====================

/**
 * リポジトリのコミット一覧を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param params 取得パラメータ
 * @returns コミット一覧
 */
export async function getRepositoryCommits(
	owner: string,
	repo: string,
	params?: GitHubCommitParams
): Promise<ServiceResult<GitHubCommit[]>> {
	return handleServiceCall(
		async () => {
			const searchParams = new URLSearchParams();
			if (params?.sha) searchParams.append("sha", params.sha);
			if (params?.path) searchParams.append("path", params.path);
			if (params?.since) searchParams.append("since", params.since);
			if (params?.until) searchParams.append("until", params.until);
			if (params?.per_page) searchParams.append("per_page", params.per_page.toString());
			if (params?.page) searchParams.append("page", params.page.toString());

			const queryString = searchParams.toString();
			const endpoint = `/repos/${owner}/${repo}/commits${queryString ? `?${queryString}` : ""}`;
			const response = await fetchGitHubApi<GitHubCommit[]>(endpoint);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data || [];
		},
		"コミット一覧の取得に失敗しました"
	);
}

/**
 * 特定のコミット情報を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param sha コミットSHA
 * @returns コミット情報
 */
export async function getCommit(
	owner: string,
	repo: string,
	sha: string
): Promise<ServiceResult<GitHubCommit | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchGitHubApi<GitHubCommit>(`/repos/${owner}/${repo}/commits/${sha}`);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data;
		},
		"コミット情報の取得に失敗しました"
	);
}

// ==================== イシュー関連 ====================

/**
 * リポジトリのイシュー一覧を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param state イシューステータス（open, closed, all）
 * @param labels ラベルでフィルタ
 * @returns イシュー一覧
 */
export async function getRepositoryIssues(
	owner: string,
	repo: string,
	state: "open" | "closed" | "all" = "open",
	labels?: string
): Promise<ServiceResult<GitHubIssue[]>> {
	return handleServiceCall(
		async () => {
			const params = new URLSearchParams({ state });
			if (labels) params.append("labels", labels);

			const response = await fetchGitHubApi<GitHubIssue[]>(
				`/repos/${owner}/${repo}/issues?${params.toString()}`
			);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data || [];
		},
		"イシュー一覧の取得に失敗しました"
	);
}

/**
 * 特定のイシュー情報を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param issueNumber イシュー番号
 * @returns イシュー情報
 */
export async function getIssue(
	owner: string,
	repo: string,
	issueNumber: number
): Promise<ServiceResult<GitHubIssue | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchGitHubApi<GitHubIssue>(
				`/repos/${owner}/${repo}/issues/${issueNumber}`
			);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data;
		},
		"イシュー情報の取得に失敗しました"
	);
}

// ==================== プルリクエスト関連 ====================

/**
 * リポジトリのプルリクエスト一覧を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param state プルリクエストステータス（open, closed, all）
 * @returns プルリクエスト一覧
 */
export async function getRepositoryPullRequests(
	owner: string,
	repo: string,
	state: "open" | "closed" | "all" = "open"
): Promise<ServiceResult<GitHubPullRequest[]>> {
	return handleServiceCall(
		async () => {
			const response = await fetchGitHubApi<GitHubPullRequest[]>(
				`/repos/${owner}/${repo}/pulls?state=${state}`
			);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data || [];
		},
		"プルリクエスト一覧の取得に失敗しました"
	);
}

/**
 * 特定のプルリクエスト情報を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param pullNumber プルリクエスト番号
 * @returns プルリクエスト情報
 */
export async function getPullRequest(
	owner: string,
	repo: string,
	pullNumber: number
): Promise<ServiceResult<GitHubPullRequest | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchGitHubApi<GitHubPullRequest>(
				`/repos/${owner}/${repo}/pulls/${pullNumber}`
			);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data;
		},
		"プルリクエスト情報の取得に失敗しました"
	);
}

// ==================== ブランチ関連 ====================

/**
 * リポジトリのブランチ一覧を取得する
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @returns ブランチ一覧
 */
export async function getRepositoryBranches(
	owner: string,
	repo: string
): Promise<ServiceResult<GitHubBranch[]>> {
	return handleServiceCall(
		async () => {
			const response = await fetchGitHubApi<GitHubBranch[]>(`/repos/${owner}/${repo}/branches`);
			if (response.error) {
				throw new Error(response.error);
			}
			return response.data || [];
		},
		"ブランチ一覧の取得に失敗しました"
	);
}

// ==================== ユーティリティ ====================

/**
 * GitHub API 接続テスト
 * @returns 接続テスト結果
 */
export async function testGitHubConnection(): Promise<ServiceResult<{ authenticated: boolean; rate_limit: number }>> {
	return handleServiceCall(
		async () => {
			// Rate Limit API を使用して接続確認
			const response = await fetchGitHubApi<{
				resources: {
					core: {
						limit: number;
						remaining: number;
						reset: number;
					};
				};
			}>("/rate_limit");

			if (response.error) {
				throw new Error(response.error);
			}

			const token = getGitHubToken();
			return {
				authenticated: !!token,
				rate_limit: response.data?.resources.core.remaining || 0,
			};
		},
		"GitHub API 接続テストに失敗しました"
	);
}

