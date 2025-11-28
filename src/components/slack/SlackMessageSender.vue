<!-- Slack メッセージ送信コンポーネント -->
<script setup lang="ts">
import { ref } from "vue";
import { sendMessage, sendWebhookMessage, getChannels, resolveChannelId } from "@/services/slackService";
import type { SlackChannel } from "@/types/slack";

// Props: 初期チャンネル（オプション）
interface Props {
	initialChannel?: string;
	useWebhook?: boolean; // Webhook URL を使用するかどうか
}

const props = withDefaults(defineProps<Props>(), {
	initialChannel: "",
	useWebhook: false,
});

// Emits: メッセージ送信完了イベント
const emit = defineEmits<{
	messageSent: [{ success: boolean; message?: string; error?: string }];
}>();

// 状態管理
const channel = ref(props.initialChannel);
const message = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const channels = ref<SlackChannel[]>([]);
const showChannelSelect = ref(false);

// チャンネル一覧を読み込む
const loadChannels = async () => {
	if (props.useWebhook) {
		// Webhook の場合はチャンネル一覧を取得できない
		return;
	}

	try {
		const result = await getChannels({ exclude_archived: true });
		if (result.success && result.data) {
			channels.value = result.data;
		}
	} catch (err) {
		console.error("チャンネル一覧の取得に失敗:", err);
	}
};

// チャンネル選択を開く
const openChannelSelect = () => {
	if (!showChannelSelect.value) {
		loadChannels();
	}
	showChannelSelect.value = !showChannelSelect.value;
};

// メッセージを送信する
const sendSlackMessage = async () => {
	if (!channel.value || !message.value.trim()) {
		error.value = "チャンネルとメッセージを入力してください";
		return;
	}

	isLoading.value = true;
	error.value = null;

	try {
		if (props.useWebhook) {
			// Webhook を使用する場合
			const result = await sendWebhookMessage({
				text: message.value,
				channel: channel.value.startsWith("#") ? channel.value : `#${channel.value}`,
			});

			if (result.success) {
				emit("messageSent", { success: true, message: "メッセージを送信しました" });
				message.value = ""; // メッセージをクリア
			} else {
				error.value = result.error || "メッセージの送信に失敗しました";
				emit("messageSent", { success: false, error: error.value });
			}
		} else {
			// API トークンを使用する場合
			// チャンネル名をチャンネルIDに変換
			let channelId = channel.value;
			if (channel.value.startsWith("#")) {
				const resolveResult = await resolveChannelId(channel.value);
				if (resolveResult.success && resolveResult.data) {
					channelId = resolveResult.data;
				} else {
					error.value = "チャンネルが見つかりません";
					emit("messageSent", { success: false, error: error.value });
					isLoading.value = false;
					return;
				}
			}

			const result = await sendMessage({
				channel: channelId,
				text: message.value,
			});

			if (result.success && result.data) {
				emit("messageSent", { success: true, message: "メッセージを送信しました" });
				message.value = ""; // メッセージをクリア
			} else {
				error.value = result.error || "メッセージの送信に失敗しました";
				emit("messageSent", { success: false, error: error.value });
			}
		}
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		error.value = errorMsg;
		emit("messageSent", { success: false, error: errorMsg });
	} finally {
		isLoading.value = false;
	}
};
</script>

<template>
	<div class="slack-message-sender">
		<div class="card">
			<div class="card-header">
				<h5 class="mb-0">Slack メッセージ送信</h5>
			</div>
			<div class="card-body">
				<!-- エラー表示 -->
				<div v-if="error" class="alert alert-danger" role="alert">
					{{ error }}
				</div>

				<!-- チャンネル入力 -->
				<div class="mb-3">
					<label for="slack-channel" class="form-label">チャンネル</label>
					<div class="input-group">
						<span class="input-group-text">#</span>
						<input
							id="slack-channel"
							v-model="channel"
							type="text"
							class="form-control"
							placeholder="general"
							:disabled="isLoading"
						/>
						<button
							v-if="!useWebhook"
							class="btn btn-outline-secondary"
							type="button"
							@click="openChannelSelect"
							:disabled="isLoading"
						>
							<i class="fas fa-list"></i>
						</button>
					</div>
					<!-- チャンネル選択ドロップダウン -->
					<div v-if="showChannelSelect && channels.length > 0" class="channel-select-dropdown">
						<div
							v-for="ch in channels"
							:key="ch.id"
							class="channel-item"
							@click="
								channel = ch.name;
								showChannelSelect = false;
							"
						>
							<strong>#{{ ch.name }}</strong>
							<small v-if="ch.topic?.value" class="text-muted d-block">{{ ch.topic.value }}</small>
						</div>
					</div>
				</div>

				<!-- メッセージ入力 -->
				<div class="mb-3">
					<label for="slack-message" class="form-label">メッセージ</label>
					<textarea
						id="slack-message"
						v-model="message"
						class="form-control"
						rows="4"
						placeholder="送信するメッセージを入力してください..."
						:disabled="isLoading"
					></textarea>
				</div>

				<!-- 送信ボタン -->
				<button
					class="btn btn-primary"
					:disabled="isLoading || !channel || !message.trim()"
					@click="sendSlackMessage"
				>
					<span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
					<i v-else class="fas fa-paper-plane me-2"></i>
					{{ isLoading ? "送信中..." : "送信" }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.slack-message-sender {
	padding: 16px;
}

.channel-select-dropdown {
	position: absolute;
	z-index: 1000;
	background: white;
	border: 1px solid #ddd;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	max-height: 200px;
	overflow-y: auto;
	margin-top: 4px;
}

.channel-item {
	padding: 8px 12px;
	cursor: pointer;
	border-bottom: 1px solid #eee;
}

.channel-item:hover {
	background-color: #f5f5f5;
}

.channel-item:last-child {
	border-bottom: none;
}
</style>

