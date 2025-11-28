<!-- Slack チャンネルメッセージ閲覧コンポーネント -->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { getChannels, getChannelMessages } from "@/services/slackService";
import type { SlackChannel, SlackMessage } from "@/types/slack";

// チャンネル選択とメッセージ一覧の状態
const channels = ref<SlackChannel[]>([]);
const selectedChannel = ref("#general");
const messages = ref<SlackMessage[]>([]);
const isLoadingChannels = ref(false);
const isLoadingMessages = ref(false);
const errorMessage = ref<string | null>(null);
const nextCursor = ref<string | null>(null);

// タイムスタンプを日本時間で表示
const formatTimestamp = (ts: string): string => {
	const numericTs = Number(ts) * 1000;
	return Number.isFinite(numericTs) ? new Date(numericTs).toLocaleString("ja-JP") : ts;
};

// チャンネル一覧取得（テスト用の最小件数）
const loadChannels = async () => {
	isLoadingChannels.value = true;
	try {
		const result = await getChannels({ exclude_archived: true, limit: 30 });
		if (result.success && result.data) {
			channels.value = result.data;
			if (!selectedChannel.value && result.data.length > 0) {
				selectedChannel.value = `#${result.data[0].name}`;
			}
		} else {
			errorMessage.value = result.error || "チャンネル一覧の取得に失敗しました";
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		errorMessage.value = message;
	} finally {
		isLoadingChannels.value = false;
	}
};

// チャンネルメッセージを読み込み
const loadMessages = async (isLoadMore = false) => {
	if (!selectedChannel.value) {
		errorMessage.value = "チャンネルを選択してください";
		return;
	}

	isLoadingMessages.value = true;
	errorMessage.value = null;

	try {
		const result = await getChannelMessages(selectedChannel.value, {
			cursor: isLoadMore ? nextCursor.value ?? undefined : undefined,
			limit: 20,
		});

		if (result.success && result.data) {
			nextCursor.value = result.data.nextCursor ?? null;
			if (isLoadMore) {
				messages.value = [...messages.value, ...result.data.messages];
			} else {
				messages.value = result.data.messages;
			}
		} else {
			errorMessage.value = result.error || "メッセージの取得に失敗しました";
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		errorMessage.value = message;
	} finally {
		isLoadingMessages.value = false;
	}
};

// チャンネル変更時は履歴をリセットして再取得
watch(
	() => selectedChannel.value,
	(newValue, oldValue) => {
		if (!newValue || newValue === oldValue) {
			return;
		}
		messages.value = [];
		nextCursor.value = null;
		loadMessages(false);
	}
);

onMounted(async () => {
	await loadChannels();
	await loadMessages(false);
});
</script>

<template>
	<div class="slack-channel-viewer">
		<div class="card">
			<div class="card-header d-flex justify-content-between align-items-center">
				<div>
					<h5 class="mb-0">Slack チャンネルメッセージ</h5>
					<small class="text-muted">最新の投稿を確認できます</small>
				</div>
				<button class="btn btn-sm btn-outline-primary" :disabled="isLoadingMessages" @click="loadMessages(false)">
					<i class="fas fa-sync-alt me-1"></i>
					最新を取得
				</button>
			</div>
			<div class="card-body">
				<!-- チャンネル選択セクション -->
				<div class="mb-3">
					<label for="slack-channel-select" class="form-label">チャンネルを選択</label>
					<select
						id="slack-channel-select"
						v-model="selectedChannel"
						class="form-select"
						:disabled="isLoadingChannels || isLoadingMessages"
					>
						<option value="" disabled>チャンネルを選択してください</option>
						<option v-for="channelItem in channels" :key="channelItem.id" :value="`#${channelItem.name}`">
							#{{ channelItem.name }}
						</option>
					</select>
				</div>

				<!-- エラー表示 -->
				<div v-if="errorMessage" class="alert alert-danger" role="alert">
					{{ errorMessage }}
				</div>

				<!-- メッセージ一覧 -->
				<div v-if="messages.length > 0" class="message-list">
					<div v-for="messageItem in messages" :key="messageItem.ts" class="message-item">
						<div class="message-meta">
							<strong>{{ messageItem.user || messageItem.username || "Bot" }}</strong>
							<small class="text-muted ms-2">{{ formatTimestamp(messageItem.ts) }}</small>
						</div>
						<p class="message-text">{{ messageItem.text }}</p>
					</div>
				</div>

				<!-- 空状態 -->
				<div v-else-if="!isLoadingMessages" class="alert alert-secondary" role="alert">
					投稿が見つかりません。別のチャンネルを選択してください。
				</div>

				<!-- 読み込み中表示 -->
				<div v-if="isLoadingMessages" class="text-center my-3">
					<div class="spinner-border text-primary" role="status">
						<span class="visually-hidden">読み込み中...</span>
					</div>
				</div>

				<!-- 追加読み込みボタン -->
				<div class="d-flex justify-content-center mt-3" v-if="nextCursor">
					<button class="btn btn-outline-secondary" :disabled="isLoadingMessages" @click="loadMessages(true)">
						<i class="fas fa-chevron-down me-1"></i>
						さらに読み込む
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.slack-channel-viewer {
	padding: 16px;
}

.message-list {
	max-height: 320px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 12px;
}

.message-item + .message-item {
	margin-top: 12px;
	border-top: 1px solid #f0f0f0;
	padding-top: 12px;
}

.message-text {
	white-space: pre-line;
	margin-bottom: 0;
}
</style>

