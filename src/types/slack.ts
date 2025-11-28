// Slack API 用の型定義

// メッセージ送信パラメータ
export interface SlackMessageParams {
	channel: string; // チャンネルIDまたはチャンネル名（例: "#general" または "C1234567890"）
	text?: string; // プレーンテキストメッセージ
	blocks?: SlackBlock[]; // Block Kit を使用したリッチなメッセージ
	attachments?: SlackAttachment[]; // レガシーアタッチメント（非推奨）
	thread_ts?: string; // スレッドのタイムスタンプ（スレッド返信用）
	username?: string; // ボット名（Webhook の場合）
	icon_emoji?: string; // アイコン絵文字（Webhook の場合）
	icon_url?: string; // アイコンURL（Webhook の場合）
}

// Block Kit ブロック
export interface SlackBlock {
	type: string; // "section", "divider", "header", "context" など
	text?: {
		type: "mrkdwn" | "plain_text";
		text: string;
		emoji?: boolean;
	};
	fields?: Array<{
		type: "mrkdwn" | "plain_text";
		text: string;
	}>;
	accessory?: {
		type: string;
		text?: {
			type: "plain_text";
			text: string;
		};
		url?: string;
		value?: string;
	};
	elements?: SlackBlock[];
}

// レガシーアタッチメント
export interface SlackAttachment {
	color?: string; // 左側のバーカラー（例: "good", "warning", "danger"）
	title?: string;
	title_link?: string;
	text?: string;
	fields?: Array<{
		title: string;
		value: string;
		short?: boolean;
	}>;
	footer?: string;
	ts?: number; // タイムスタンプ
}

// チャンネル情報
export interface SlackChannel {
	id: string;
	name: string;
	is_channel: boolean;
	is_group: boolean;
	is_im: boolean;
	is_private: boolean;
	is_archived: boolean;
	is_general?: boolean;
	created: number;
	creator: string;
	is_member?: boolean;
	num_members?: number;
	topic?: {
		value: string;
		creator: string;
		last_set: number;
	};
	purpose?: {
		value: string;
		creator: string;
		last_set: number;
	};
}

// ユーザー情報
export interface SlackUser {
	id: string;
	name: string;
	real_name: string;
	display_name: string;
	email?: string;
	image_24?: string;
	image_32?: string;
	image_48?: string;
	image_72?: string;
	image_192?: string;
	image_512?: string;
	is_admin?: boolean;
	is_owner?: boolean;
	is_primary_owner?: boolean;
	is_restricted?: boolean;
	is_ultra_restricted?: boolean;
	is_bot?: boolean;
	deleted?: boolean;
	presence?: "active" | "away";
	tz?: string;
}

// メッセージ情報
export interface SlackMessage {
	ts: string; // タイムスタンプ
	type: string;
	text: string;
	user?: string;
	username?: string;
	bot_id?: string;
	attachments?: SlackAttachment[];
	blocks?: SlackBlock[];
	thread_ts?: string; // スレッドの親メッセージのタイムスタンプ
	reply_count?: number;
	replies?: Array<{
		user: string;
		ts: string;
	}>;
	reactions?: Array<{
		name: string;
		count: number;
		users: string[];
	}>;
}

// Slack API レスポンス用の共通型
export interface SlackApiResponse<T> {
	ok: boolean;
	data?: T;
	error?: string;
	warning?: string;
	response_metadata?: {
		next_cursor?: string;
		warnings?: string[];
	};
}

// チャンネル一覧取得パラメータ
export interface SlackChannelListParams {
	types?: string; // チャンネルタイプ（例: "public_channel,private_channel"）
	exclude_archived?: boolean;
	limit?: number;
	cursor?: string; // ページネーション用
}

// チャンネル履歴取得パラメータ
export interface SlackChannelHistoryParams {
	cursor?: string; // ページネーション用
	limit?: number;
	oldest?: string; // 取得範囲の開始タイムスタンプ
	latest?: string; // 取得範囲の終了タイムスタンプ
	inclusive?: boolean; // oldest/latest を含めるかどうか
}

// ユーザー一覧取得パラメータ
export interface SlackUserListParams {
	cursor?: string; // ページネーション用
	limit?: number;
	include_locale?: boolean;
}

// ファイルアップロードパラメータ
export interface SlackFileUploadParams {
	channels?: string; // チャンネルID（カンマ区切り）
	file?: File | Blob; // アップロードするファイル
	filename?: string;
	title?: string;
	initial_comment?: string;
	thread_ts?: string; // スレッドに投稿する場合
}

// ファイル情報
export interface SlackFile {
	id: string;
	created: number;
	timestamp: number;
	name: string;
	title: string;
	mimetype: string;
	filetype: string;
	pretty_type: string;
	user: string;
	size: number;
	url_private?: string;
	url_private_download?: string;
	thumb_64?: string;
	thumb_80?: string;
	thumb_360?: string;
	thumb_360_w?: number;
	thumb_360_h?: number;
	permalink: string;
	permalink_public?: string;
	channels?: string[];
	groups?: string[];
	ims?: string[];
	comments_count?: number;
}

// リアクション追加パラメータ
export interface SlackReactionParams {
	channel: string;
	timestamp: string; // メッセージのタイムスタンプ
	name: string; // 絵文字名（例: "thumbsup", "+1"）
}

// Webhook メッセージ送信パラメータ（Webhook URL を使用する場合）
export interface SlackWebhookMessage {
	text: string;
	blocks?: SlackBlock[];
	attachments?: SlackAttachment[];
	username?: string;
	icon_emoji?: string;
	icon_url?: string;
	channel?: string;
	thread_ts?: string;
}

