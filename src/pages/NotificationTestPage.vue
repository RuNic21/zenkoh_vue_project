<script setup lang="ts">
// 通知テストページ
// 目的: 通知システムの動作を確認・テスト

import { ref, onMounted } from "vue";
import { createNotificationFromTemplate, listNotifications, getNotificationStats } from "@/services/notificationService";
import { listUsers } from "@/services/dbServices";
import { listProjects } from "@/services/projectService";
import { checkNotificationsInDatabase, checkUsersTable } from "@/utils/notificationDebugger";
import { useMessage } from "@/composables/useMessage";
import type { Users } from "@/types/db/users";
import type { Project } from "@/types/project";
import type { Notification, NotificationStats, NotificationStatus } from "@/types/notification";

type TestForm = {
  templateId: "task_assigned" | "task_due_soon" | "task_overdue" | "project_updated";
  recipientUserId: number | null;
  projectId: number | null;
  taskName: string;
  priority: string;
};

const users = ref<Users[]>([]);
const projects = ref<Project[]>([]);
const notifications = ref<Notification[]>([]);
const stats = ref<NotificationStats | null>(null);
const isLoading = ref(false);
const { showSuccess, showError, showInfo } = useMessage();

// テストフォーム
const testForm = ref<TestForm>({
  templateId: "task_assigned",
  recipientUserId: null,
  projectId: null,
  taskName: "テストタスク",
  priority: "高"
});

// 通知ステータスに応じたクラスを返却
const getStatusClass = (status: NotificationStatus) => {
  switch (status) {
    case "QUEUED":
      return "bg-gradient-warning";
    case "SENT":
      return "bg-gradient-success";
    case "FAILED":
      return "bg-gradient-danger";
    case "CANCELLED":
      return "bg-gradient-secondary";
    default:
      return "bg-gradient-secondary";
  }
};

// データ読み込み
const loadData = async () => {
  isLoading.value = true;
  try {
    // ユーザー読み込み
    const usersResult = await listUsers();
    if (usersResult.success && usersResult.data) {
      users.value = usersResult.data;
    }
    
    // プロジェクト読み込み
    const projectsResult = await listProjects();
    if (projectsResult.success && projectsResult.data) {
      projects.value = projectsResult.data;
    }
    
    // 通知読み込み
    const notificationsResult = await listNotifications({}, 10);
    if (notificationsResult.success && notificationsResult.data) {
      notifications.value = notificationsResult.data;
    }
    
    // 統計読み込み
    const statsResult = await getNotificationStats();
    if (statsResult.success && statsResult.data) {
      stats.value = statsResult.data;
    }
  } catch (error) {
    console.error("データ読み込みエラー:", error);
  } finally {
    isLoading.value = false;
  }
};

// テスト通知送信
const sendTestNotification = async () => {
  if (!testForm.value.recipientUserId || !testForm.value.projectId) {
    showError("受信者とプロジェクトを選択してください");
    return;
  }
  
  try {
    const recipient = users.value.find(u => u.id === testForm.value.recipientUserId);
    const project = projects.value.find(p => p.id === testForm.value.projectId);
    
    if (!recipient || !project) {
      showError("受信者またはプロジェクトが見つかりません");
      return;
    }
    
    console.log("📧 テスト通知送信中...");
    console.log("   - 受信者:", recipient);
    console.log("   - プロジェクト:", project);
    
    const variables = {
      user_name: recipient.display_name || "ユーザー",
      task_name: testForm.value.taskName,
      project_name: project.name,
      due_date: new Date().toLocaleDateString("ja-JP"),
      priority: testForm.value.priority
    };
    
    const result = await createNotificationFromTemplate(
      testForm.value.templateId,
      variables,
      recipient.email,
      project.id,
      undefined
    );
    
    if (result) {
      console.log("✅ テスト通知が作成されました:", result);
      showSuccess("通知が正常に作成されました");
      await loadData();
      await checkNotificationsInDatabase();
    } else {
      console.error("❌ 通知作成に失敗しました");
      showError("通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("テスト通知送信エラー:", error);
    const message = error instanceof Error ? error.message : String(error);
    showError(`エラーが発生しました: ${message}`);
  }
};

// データベースチェック
const runDatabaseCheck = async () => {
  console.log("🔍 データベースチェック開始");
  showInfo("データベースチェックを開始します");
  await checkUsersTable();
  await checkNotificationsInDatabase();
  showSuccess("データベースチェックが完了しました");
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h5>🔬 通知システムテスト</h5>
            <p class="text-sm mb-0">通知の動作を確認・デバッグするためのテストページです</p>
          </div>
          <div class="card-body">
            <!-- 統計情報 -->
            <div class="row mb-4" v-if="stats">
              <div class="col-md-3">
                <div class="card">
                  <div class="card-body p-3 text-center">
                    <h6 class="text-sm mb-0">総通知数</h6>
                    <h3 class="font-weight-bold mb-0">{{ stats.total_notifications }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card">
                  <div class="card-body p-3 text-center">
                    <h6 class="text-sm mb-0">送信待ち</h6>
                    <h3 class="font-weight-bold mb-0 text-warning">{{ stats.queued_notifications }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card">
                  <div class="card-body p-3 text-center">
                    <h6 class="text-sm mb-0">送信済み</h6>
                    <h3 class="font-weight-bold mb-0 text-success">{{ stats.sent_notifications }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card">
                  <div class="card-body p-3 text-center">
                    <h6 class="text-sm mb-0">失敗</h6>
                    <h3 class="font-weight-bold mb-0 text-danger">{{ stats.failed_notifications }}</h3>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- テストフォーム -->
            <div class="card mb-4">
              <div class="card-header pb-0">
                <h6>📨 テスト通知送信</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">テンプレート</label>
                    <select class="form-select" v-model="testForm.templateId">
                      <option value="task_assigned">タスク割り当て</option>
                      <option value="task_due_soon">タスク期限間近</option>
                      <option value="task_overdue">タスク期限超過</option>
                      <option value="project_updated">プロジェクト更新</option>
                    </select>
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label class="form-label">受信者</label>
                    <select class="form-select" v-model.number="testForm.recipientUserId">
                      <option :value="null">選択してください</option>
                      <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.display_name || "ユーザー" }} ({{ user.email }})
                      </option>
                    </select>
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label class="form-label">プロジェクト</label>
                    <select class="form-select" v-model.number="testForm.projectId">
                      <option :value="null">選択してください</option>
                      <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label class="form-label">タスク名</label>
                    <input type="text" class="form-control" v-model="testForm.taskName">
                  </div>
                  
                  <div class="col-12">
                    <button class="btn bg-gradient-primary me-2" @click="sendTestNotification">
                      <i class="fa fa-paper-plane me-1"></i>
                      テスト通知送信
                    </button>
                    <button class="btn bg-gradient-info me-2" @click="loadData">
                      <i class="fa fa-refresh me-1"></i>
                      データ再読み込み
                    </button>
                    <button class="btn bg-gradient-warning" @click="runDatabaseCheck">
                      <i class="fa fa-database me-1"></i>
                      データベースチェック
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 通知一覧 -->
            <div class="card">
              <div class="card-header pb-0">
                <h6>📋 最近の通知 (最新10件)</h6>
              </div>
              <div class="card-body">
                <div v-if="isLoading" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status"></div>
                  <p class="text-sm mt-2">読み込み中...</p>
                </div>
                <div v-else-if="notifications.length === 0" class="text-center py-4">
                  <p class="text-sm text-secondary">通知がありません</p>
                </div>
                <div v-else class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>件名</th>
                        <th>送信先</th>
                        <th>状態</th>
                        <th>作成日時</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="notification in notifications" :key="notification.id">
                        <td>{{ notification.id }}</td>
                        <td>{{ notification.subject }}</td>
                        <td>{{ notification.to_email }}</td>
                        <td>
                          <span 
                            :class="['badge', 'badge-sm', getStatusClass(notification.status)]"
                          >
                            {{ notification.status }}
                          </span>
                        </td>
                        <td>{{ new Date(notification.created_at).toLocaleString('ja-JP') }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  margin-bottom: 1rem;
}
</style>

