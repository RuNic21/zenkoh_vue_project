# Slack API 連携ガイド

## 📋 概要

Zenkoh Project Scheduler で Slack API を使用してメッセージ送信、チャンネル・ユーザー情報取得、ファイルアップロードなどを実行する方法を説明します。

## 🚀 クイックスタート

### 1. 環境変数設定

`.env.local` ファイルに Slack トークンまたは Webhook URL を追加します。

#### 方法1: Slack Bot Token を使用（推奨）

```bash
# Slack Bot Token（OAuth Token）
# より多くの機能を使用できます（チャンネル一覧、ユーザー一覧、ファイルアップロードなど）
VITE_SLACK_TOKEN=xoxb-your-slack-bot-token-here
```

#### 方法2: Slack Webhook URL を使用（簡単）

```bash
# Slack Incoming Webhook URL
# メッセージ送信のみ可能ですが、設定が簡単です
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Slack Bot Token の取得方法

1. [Slack API](https://api.slack.com/apps) にアクセス
2. "Create New App" をクリック
3. "From scratch" を選択
4. アプリ名とワークスペースを選択
5. "OAuth & Permissions" に移動
6. "Bot Token Scopes" で必要なスコープを追加：
   - `chat:write` - メッセージ送信
   - `channels:read` - チャンネル一覧取得
   - `users:read` - ユーザー一覧取得
   - `files:write` - ファイルアップロード
   - `reactions:write` - リアクション追加
7. "Install to Workspace" をクリック
8. 生成された "Bot User OAuth Token" をコピーして `.env.local` に設定

#### Slack Webhook URL の取得方法

1. [Slack API](https://api.slack.com/apps) にアクセス
2. アプリを選択（または新規作成）
3. "Incoming Webhooks" に移動
4. "Activate Incoming Webhooks" を有効化
5. "Add New Webhook to Workspace" をクリック
6. チャンネルを選択
7. 生成された Webhook URL をコピーして `.env.local` に設定

**注意**: トークンや Webhook URL は機密情報なので、`.env.local` を Git にコミットしないでください。

### 2. 基本的な使用方法

#### メッセージを送信（Bot Token 使用）

```typescript
import { sendMessage } from "@/services/slackService";

// Vue コンポーネント内
const sendSlackNotification = async () => {
  const result = await sendMessage({
    channel: "#general", // またはチャンネルID "C1234567890"
    text: "タスクが完了しました！",
  });

  if (result.success) {
    console.log("メッセージを送信しました");
  } else {
    console.error("エラー:", result.error);
  }
};
```

#### メッセージを送信（Webhook 使用）

```typescript
import { sendWebhookMessage } from "@/services/slackService";

const sendSlackNotification = async () => {
  const result = await sendWebhookMessage({
    text: "タスクが完了しました！",
    channel: "#general", // Webhook のデフォルトチャンネルを上書き
  });

  if (result.success) {
    console.log("メッセージを送信しました");
  }
};
```

#### リッチなメッセージを送信（Block Kit）

```typescript
import { sendMessage } from "@/services/slackService";

const sendRichMessage = async () => {
  const result = await sendMessage({
    channel: "#general",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*タスク完了通知*\nタスク「機能実装」が完了しました。",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: "*プロジェクト:*\nZenkoh Project",
          },
          {
            type: "mrkdwn",
            text: "*担当者:*\n@user",
          },
        ],
      },
    ],
  });
};
```

#### チャンネル一覧を取得

```typescript
import { getChannels } from "@/services/slackService";

const loadChannels = async () => {
  const result = await getChannels({
    exclude_archived: true,
    types: "public_channel,private_channel",
  });

  if (result.success && result.data) {
    result.data.forEach((channel) => {
      console.log(`#${channel.name}: ${channel.topic?.value || "説明なし"}`);
    });
  }
};
```

#### ユーザー一覧を取得

```typescript
import { getUsers } from "@/services/slackService";

const loadUsers = async () => {
  const result = await getUsers();

  if (result.success && result.data) {
    result.data.forEach((user) => {
      if (!user.deleted && !user.is_bot) {
        console.log(`${user.real_name} (@${user.name})`);
      }
    });
  }
};
```

#### ファイルをアップロード

```typescript
import { uploadFile } from "@/services/slackService";

const uploadReport = async (file: File) => {
  const result = await uploadFile({
    channels: "#general",
    file: file,
    filename: "report.pdf",
    title: "月次レポート",
    initial_comment: "今月のレポートです",
  });

  if (result.success && result.data) {
    console.log("ファイルをアップロードしました:", result.data.permalink);
  }
};
```

#### リアクションを追加

```typescript
import { addReaction } from "@/services/slackService";

const addThumbsUp = async (channelId: string, messageTs: string) => {
  const result = await addReaction({
    channel: channelId,
    timestamp: messageTs,
    name: "thumbsup",
  });

  if (result.success) {
    console.log("リアクションを追加しました");
  }
};
```

### 3. 接続テスト

```typescript
import { testSlackConnection } from "@/services/slackService";

const testConnection = async () => {
  const result = await testSlackConnection();
  if (result.success && result.data) {
    console.log("認証状態: 認証済み");
    console.log("ワークスペース:", result.data.team);
    console.log("ユーザー:", result.data.user);
  } else {
    console.error("エラー:", result.error);
  }
};
```

## 📚 利用可能な関数一覧

### メッセージ送信関連
- `sendMessage(params)` - メッセージを送信（Bot Token 使用）
- `sendWebhookMessage(message)` - Webhook URL を使用してメッセージを送信

### チャンネル関連
- `getChannels(params?)` - チャンネル一覧を取得
- `getChannel(channelId)` - 特定のチャンネル情報を取得
- `resolveChannelId(channelName)` - チャンネル名からチャンネルIDを取得

### ユーザー関連
- `getUsers(params?)` - ユーザー一覧を取得
- `getUser(userId)` - 特定のユーザー情報を取得

### ファイル関連
- `uploadFile(params)` - ファイルをアップロード

### リアクション関連
- `addReaction(params)` - メッセージにリアクションを追加
- `removeReaction(params)` - メッセージからリアクションを削除

### ユーティリティ
- `testSlackConnection()` - Slack API 接続テスト

## 🎯 実装例: Vue コンポーネント

### メッセージ送信コンポーネント

```vue
<script setup lang="ts">
import { ref } from "vue";
import { sendMessage } from "@/services/slackService";

const channel = ref("#general");
const message = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);

const sendSlackMessage = async () => {
  if (!message.value.trim()) {
    error.value = "メッセージを入力してください";
    return;
  }

  isLoading.value = true;
  error.value = null;

  const result = await sendMessage({
    channel: channel.value,
    text: message.value,
  });

  if (result.success) {
    message.value = "";
    alert("メッセージを送信しました");
  } else {
    error.value = result.error || "メッセージの送信に失敗しました";
  }

  isLoading.value = false;
};
</script>

<template>
  <div class="slack-sender">
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <input v-model="channel" type="text" placeholder="#general" />
    <textarea v-model="message" placeholder="メッセージを入力..."></textarea>
    <button @click="sendSlackMessage" :disabled="isLoading">
      {{ isLoading ? "送信中..." : "送信" }}
    </button>
  </div>
</template>
```

### タスク完了通知の例

```typescript
import { sendMessage } from "@/services/slackService";

// タスク完了時に Slack に通知
export async function notifyTaskCompletion(task: Task, project: Project) {
  const result = await sendMessage({
    channel: "#project-updates",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *タスク完了*\n*${task.title}* が完了しました。`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*プロジェクト:*\n${project.name}`,
          },
          {
            type: "mrkdwn",
            text: `*担当者:*\n${task.assignee_name || "未割り当て"}`,
          },
          {
            type: "mrkdwn",
            text: `*期限:*\n${task.due_date || "なし"}`,
          },
        ],
      },
    ],
  });

  return result.success;
}
```

## 🔒 権限とスコープについて

Slack Bot Token を使用する場合、以下のスコープが必要です：

- **`chat:write`** - メッセージ送信に必須
- **`channels:read`** - チャンネル一覧取得に必須
- **`users:read`** - ユーザー一覧取得に必須
- **`files:write`** - ファイルアップロードに必須
- **`reactions:write`** - リアクション追加に必須

## 📖 参考リンク

- [Slack Web API ドキュメント](https://api.slack.com/web)
- [Block Kit ビルダー](https://app.slack.com/block-kit-builder)
- [Slack API メソッド一覧](https://api.slack.com/methods)
- [Incoming Webhooks](https://api.slack.com/messaging/webhooks)

## ⚠️ 注意事項

1. **レート制限**: Slack API にはレート制限があります。大量のメッセージを送信する場合は、適切な間隔を空けてください。

2. **チャンネルID vs チャンネル名**: 
   - チャンネル名（例: `#general`）を使用する場合、内部でチャンネルIDに変換されます
   - チャンネルID（例: `C1234567890`）を直接使用すると、より高速です

3. **Webhook vs Bot Token**:
   - Webhook: 設定が簡単、メッセージ送信のみ可能
   - Bot Token: より多くの機能を使用可能、設定がやや複雑

4. **エラーハンドリング**: すべての関数は `ServiceResult` 型を返すため、`result.success` をチェックしてから `result.data` を使用してください。

