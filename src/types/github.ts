// GitHub API 用の型定義

// リポジトリ情報
export interface GitHubRepository {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	private: boolean;
	html_url: string;
	clone_url: string;
	created_at: string;
	updated_at: string;
	pushed_at: string;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	default_branch: string;
	owner: {
		login: string;
		avatar_url: string;
		type: string;
	};
}

// コミット情報
export interface GitHubCommit {
	sha: string;
	commit: {
		message: string;
		author: {
			name: string;
			email: string;
			date: string;
		};
	};
	author: {
		login: string;
		avatar_url: string;
	} | null;
	html_url: string;
}

// イシュー情報
export interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: "open" | "closed";
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	html_url: string;
	user: {
		login: string;
		avatar_url: string;
	};
	labels: Array<{
		name: string;
		color: string;
	}>;
}

// プルリクエスト情報
export interface GitHubPullRequest {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: "open" | "closed" | "merged";
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	html_url: string;
	user: {
		login: string;
		avatar_url: string;
	};
	head: {
		ref: string;
		sha: string;
	};
	base: {
		ref: string;
		sha: string;
	};
}

// ブランチ情報
export interface GitHubBranch {
	name: string;
	commit: {
		sha: string;
		url: string;
	};
	protected: boolean;
}

// GitHub API レスポンス用の共通型
export interface GitHubApiResponse<T> {
	data: T | null;
	error: string | null;
	status: number;
}

// リポジトリ検索パラメータ
export interface GitHubRepositorySearchParams {
	query?: string; // 検索クエリ（例: "vue language:typescript"）
	sort?: "stars" | "forks" | "help-wanted-issues" | "updated";
	order?: "asc" | "desc";
	per_page?: number;
	page?: number;
}

// コミット取得パラメータ
export interface GitHubCommitParams {
	sha?: string; // ブランチ名またはコミットSHA
	path?: string; // 特定のパスのコミットのみ取得
	since?: string; // ISO 8601形式の日時
	until?: string; // ISO 8601形式の日時
	per_page?: number;
	page?: number;
}

