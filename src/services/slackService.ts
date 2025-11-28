// Slack API 連携サービス
// 目的: Slack Web API を使用してメッセージ送信、チャンネル・ユーザー情報取得、ファイルアップロードなどを実行

import type {
	SlackMessageParams,
	SlackChannel,
	SlackUser,
	SlackMessage,
	SlackApiResponse,
	SlackChannelListParams,
	SlackChannelHistoryParams,
	SlackUserListParams,
	SlackFileUploadParams,
	SlackFile,
	SlackReactionParams,
	SlackWebhookMessage,
} from "../types/slack";
import { handleServiceCall, type ServiceResult } from "../utils/errorHandler";

// Slack API ベースURL
const SLACK_API_BASE = import.meta.env.DEV ? "/slack-proxy" : "https://slack.com/api";

// 環境変数から Slack トークンを取得
const getSlackToken = (): string | null => {
	return import.meta.env.VITE_SLACK_TOKEN || null;
};

// 環境変数から Slack Webhook URL を取得
const getSlackWebhookUrl = (): string | null => {
	return import.meta.env.VITE_SLACK_WEBHOOK_URL || null;
};

// Slack API リクエスト用のヘッダーを生成
const getSlackHeaders = (): HeadersInit => {
	const headers: HeadersInit = {
		"Content-Type": "application/json",
	};

	const token = getSlackToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
};

// Slack API リクエストを実行する共通関数
async function fetchSlackApi<T>(
	method: string,
	params: Record<string, unknown> = {}
): Promise<SlackApiResponse<T>> {
	try {
		const token = getSlackToken();
		if (!token) {
			return {
				ok: false,
				error: "Slack トークンが設定されていません。VITE_SLACK_TOKEN を設定してください。",
			};
		}

		// FormData を使用する場合（ファイルアップロードなど）を考慮
		const isFormData = params instanceof FormData;
		const body = isFormData ? params : JSON.stringify(params);

		const headers = isFormData ? {} : getSlackHeaders();

		const response = await fetch(`${SLACK_API_BASE}/${method}`, {
			method: "POST",
			headers,
			body,
		});

		const data = await response.json();

		if (!data.ok) {
			return {
				ok: false,
				error: data.error || `Slack API エラー: ${response.status}`,
			};
		}

		return {
			ok: true,
			data: data as T,
			response_metadata: data.response_metadata,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			error: errorMsg,
		};
	}
}

// ==================== メッセージ送信関連 ====================

/**
 * メッセージを送信する
 * @param params メッセージ送信パラメータ
 * @returns 送信結果（タイムスタンプなど）
 */
export async function sendMessage(
	params: SlackMessageParams
): Promise<ServiceResult<{ ts: string; channel: string; message: SlackMessage } | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchSlackApi<{
				ts: string;
				channel: string;
				message: SlackMessage;
			}>("chat.postMessage", params);

			if (!response.ok || !response.data) {
				throw new Error(response.error || "メッセージ送信に失敗しました");
			}

			return response.data;
		},
		"メッセージの送信に失敗しました"
	);
}

/**
 * Webhook URL を使用してメッセージを送信する（トークン不要）
 * @param message Webhook メッセージ
 * @returns 送信結果
 */
export async function sendWebhookMessage(
	message: SlackWebhookMessage
): Promise<ServiceResult<boolean>> {
	return handleServiceCall(
		async () => {
			const webhookUrl = getSlackWebhookUrl();
			if (!webhookUrl) {
				throw new Error("Slack Webhook URL が設定されていません。VITE_SLACK_WEBHOOK_URL を設定してください。");
			}

			const response = await fetch(webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`Webhook 送信に失敗: ${response.status} ${text}`);
			}

			// Webhook のレスポンスは "ok" というテキストのみ
			return true;
		},
		"Webhook メッセージの送信に失敗しました"
	);
}

// ==================== チャンネル関連 ====================

/**
 * チャンネル一覧を取得する
 * @param params 取得パラメータ
 * @returns チャンネル一覧
 */
export async function getChannels(
	params?: SlackChannelListParams
): Promise<ServiceResult<SlackChannel[]>> {
	return handleServiceCall(
		async () => {
			const apiParams: Record<string, unknown> = {};
			if (params?.types) apiParams.types = params.types;
			if (params?.exclude_archived !== undefined) apiParams.exclude_archived = params.exclude_archived;
			if (params?.limit) apiParams.limit = params.limit;
			if (params?.cursor) apiParams.cursor = params.cursor;

			const response = await fetchSlackApi<{
				channels: SlackChannel[];
			}>("conversations.list", apiParams);

			if (!response.ok || !response.data) {
				throw new Error(response.error || "チャンネル一覧の取得に失敗しました");
			}

			return response.data.channels || [];
		},
		"チャンネル一覧の取得に失敗しました"
	);
}

/**
 * 特定のチャンネル情報を取得する
 * @param channelId チャンネルID
 * @returns チャンネル情報
 */
export async function getChannel(channelId: string): Promise<ServiceResult<SlackChannel | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchSlackApi<{
				channel: SlackChannel;
			}>("conversations.info", {
				channel: channelId,
			});

			if (!response.ok || !response.data) {
				throw new Error(response.error || "チャンネル情報の取得に失敗しました");
			}

			return response.data.channel;
		},
		"チャンネル情報の取得に失敗しました"
	);
}

/**
 * チャンネルのメッセージ履歴を取得する
 * @param channelIdOrName チャンネルIDまたは #付き名称
 * @param params 取得パラメータ
 * @returns メッセージ一覧とページネーション情報
 */
export async function getChannelMessages(
	channelIdOrName: string,
	params?: SlackChannelHistoryParams
): Promise<ServiceResult<{ messages: SlackMessage[]; hasMore: boolean; nextCursor?: string }>> {
	return handleServiceCall(
		async () => {
			let targetChannel = channelIdOrName;

			if (channelIdOrName.startsWith("#")) {
				const resolveResult = await resolveChannelId(channelIdOrName);
				if (!resolveResult.success || !resolveResult.data) {
					throw new Error(resolveResult.error || "チャンネルが見つかりません");
				}
				targetChannel = resolveResult.data;
			}

			const apiParams: Record<string, unknown> = {
				channel: targetChannel,
			};

			if (params?.cursor) apiParams.cursor = params.cursor;
			if (params?.limit) apiParams.limit = params.limit;
			if (params?.oldest) apiParams.oldest = params.oldest;
			if (params?.latest) apiParams.latest = params.latest;
			if (params?.inclusive !== undefined) apiParams.inclusive = params.inclusive ? 1 : 0;

			const response = await fetchSlackApi<{
				messages: SlackMessage[];
				has_more: boolean;
				response_metadata?: { next_cursor?: string };
			}>("conversations.history", apiParams);

			if (!response.ok || !response.data) {
				throw new Error(response.error || "チャンネルメッセージの取得に失敗しました");
			}

			return {
				messages: response.data.messages || [],
				hasMore: response.data.has_more,
				nextCursor: response.data.response_metadata?.next_cursor,
			};
		},
		"チャンネルメッセージの取得に失敗しました"
	);
}

// ==================== ユーザー関連 ====================

/**
 * ユーザー一覧を取得する
 * @param params 取得パラメータ
 * @returns ユーザー一覧
 */
export async function getUsers(
	params?: SlackUserListParams
): Promise<ServiceResult<SlackUser[]>> {
	return handleServiceCall(
		async () => {
			const apiParams: Record<string, unknown> = {};
			if (params?.cursor) apiParams.cursor = params.cursor;
			if (params?.limit) apiParams.limit = params.limit;
			if (params?.include_locale !== undefined) apiParams.include_locale = params.include_locale;

			const response = await fetchSlackApi<{
				members: SlackUser[];
			}>("users.list", apiParams);

			if (!response.ok || !response.data) {
				throw new Error(response.error || "ユーザー一覧の取得に失敗しました");
			}

			return response.data.members || [];
		},
		"ユーザー一覧の取得に失敗しました"
	);
}

/**
 * 特定のユーザー情報を取得する
 * @param userId ユーザーID
 * @returns ユーザー情報
 */
export async function getUser(userId: string): Promise<ServiceResult<SlackUser | null>> {
	return handleServiceCall(
		async () => {
			const response = await fetchSlackApi<{
				user: SlackUser;
			}>("users.info", {
				user: userId,
			});

			if (!response.ok || !response.data) {
				throw new Error(response.error || "ユーザー情報の取得に失敗しました");
			}

			return response.data.user;
		},
		"ユーザー情報の取得に失敗しました"
	);
}

// ==================== ファイル関連 ====================

/**
 * ファイルをアップロードする
 * @param params ファイルアップロードパラメータ
 * @returns アップロードされたファイル情報
 */
export async function uploadFile(
	params: SlackFileUploadParams
): Promise<ServiceResult<SlackFile | null>> {
	return handleServiceCall(
		async () => {
			const token = getSlackToken();
			if (!token) {
				throw new Error("Slack トークンが設定されていません。VITE_SLACK_TOKEN を設定してください。");
			}

			if (!params.file) {
				throw new Error("アップロードするファイルが指定されていません");
			}

			const formData = new FormData();
			formData.append("file", params.file);
			if (params.channels) formData.append("channels", params.channels);
			if (params.filename) formData.append("filename", params.filename);
			if (params.title) formData.append("title", params.title);
			if (params.initial_comment) formData.append("initial_comment", params.initial_comment);
			if (params.thread_ts) formData.append("thread_ts", params.thread_ts);

			const response = await fetch(`${SLACK_API_BASE}/files.upload`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			const data = await response.json();

			if (!data.ok) {
				throw new Error(data.error || "ファイルアップロードに失敗しました");
			}

			return data.file as SlackFile;
		},
		"ファイルのアップロードに失敗しました"
	);
}

// ==================== リアクション関連 ====================

/**
 * メッセージにリアクション（絵文字）を追加する
 * @param params リアクションパラメータ
 * @returns 追加結果
 */
export async function addReaction(
	params: SlackReactionParams
): Promise<ServiceResult<boolean>> {
	return handleServiceCall(
		async () => {
			const response = await fetchSlackApi<{ ok: boolean }>("reactions.add", {
				channel: params.channel,
				timestamp: params.timestamp,
				name: params.name,
			});

			if (!response.ok) {
				throw new Error(response.error || "リアクションの追加に失敗しました");
			}

			return true;
		},
		"リアクションの追加に失敗しました"
	);
}

/**
 * メッセージからリアクション（絵文字）を削除する
 * @param params リアクションパラメータ
 * @returns 削除結果
 */
export async function removeReaction(
	params: SlackReactionParams
): Promise<ServiceResult<boolean>> {
	return handleServiceCall(
		async () => {
			const response = await fetchSlackApi<{ ok: boolean }>("reactions.remove", {
				channel: params.channel,
				timestamp: params.timestamp,
				name: params.name,
			});

			if (!response.ok) {
				throw new Error(response.error || "リアクションの削除に失敗しました");
			}

			return true;
		},
		"リアクションの削除に失敗しました"
	);
}

// ==================== ユーティリティ ====================

/**
 * Slack API 接続テスト
 * @returns 接続テスト結果
 */
export async function testSlackConnection(): Promise<
	ServiceResult<{ authenticated: boolean; team: string; user: string }>
> {
	return handleServiceCall(
		async () => {
			const response = await fetchSlackApi<{
				ok: boolean;
				team: string;
				user: string;
				team_id: string;
				user_id: string;
			}>("auth.test");

			if (!response.ok || !response.data) {
				throw new Error(response.error || "Slack API 接続テストに失敗しました");
			}

			return {
				authenticated: true,
				team: response.data.team,
				user: response.data.user,
			};
		},
		"Slack API 接続テストに失敗しました"
	);
}

/**
 * チャンネル名からチャンネルIDを取得する（# 記号を処理）
 * @param channelName チャンネル名（例: "#general" または "general"）
 * @returns チャンネルID
 */
export async function resolveChannelId(channelName: string): Promise<ServiceResult<string | null>> {
	return handleServiceCall(
		async () => {
			// # 記号を削除
			const cleanName = channelName.startsWith("#") ? channelName.slice(1) : channelName;

			const result = await getChannels({ exclude_archived: true });
			if (!result.success || !result.data) {
				throw new Error("チャンネル一覧の取得に失敗しました");
			}

			const channel = result.data.find((ch) => ch.name === cleanName);
			return channel ? channel.id : null;
		},
		"チャンネルIDの解決に失敗しました"
	);
}

