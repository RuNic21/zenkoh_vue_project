<script setup lang="ts">
// チーム管理ページコンポーネント
// 目的: ユーザー管理、チームメンバー管理、権限管理を提供

import { ref, computed, onMounted } from "vue";
import type { 
  User, 
  TeamMemberWithUser, 
  ProjectTeam, 
  TeamStats, 
  UserActivity,
  TeamRole,
  UserProfileUpdate,
  UserProfileStats,
  UserActivityLog
} from "../types/team";

// 共通コンポーネントのインポート
import PageHeader from "../components/common/PageHeader.vue";
import ActionBar from "../components/common/ActionBar.vue";
import StatCards from "../components/common/StatCards.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityBadge from "../components/common/PriorityBadge.vue";
import ModalShell from "../components/common/ModalShell.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import EmptyState from "../components/common/EmptyState.vue";
import CardHeader from "../components/common/CardHeader.vue";
import TableControls from "../components/table/TableControls.vue";
import PerformanceOptimizedTable from "../components/table/PerformanceOptimizedTable.vue";
import type {
  Notification,
  AlertRule,
  NotificationStats,
  NotificationFilter,
  NotificationStatus,
  AlertRuleType
} from "../types/notification";
import { 
  listUsers, 
  listActiveUsers, 
  createUser, 
  updateUser,
  listTeamMembersWithUsers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  getProjectTeams,
  getTeamStats,
  getUserActivityStats,
  updateUserProfile,
  getUserProfileStats,
  getUserActivityLogs,
  uploadUserAvatar,
  searchUsers
} from "../services/teamService";
import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  resendNotification,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getNotificationStats,
  createNotificationFromTemplate,
  NOTIFICATION_TEMPLATES
} from "../services/notificationService";
import { TEAM_ROLE_LABELS, TEAM_ROLE_COLORS } from "../types/team";
import { 
  NOTIFICATION_STATUS_LABELS, 
  NOTIFICATION_STATUS_COLORS,
  ALERT_RULE_TYPE_LABELS,
  ALERT_RULE_TYPE_COLORS
} from "../types/notification";

// ===== TODO: 実装予定機能 =====

// Phase 1: 基本機能（1-2週間）
// TODO: ユーザープロフィール拡張フィールドの実装
// - first_name, last_name, phone, department, position フィールドの追加
// - ユーザー情報の詳細表示・編集機能
// - プロフィール画像アップロード機能の実装

// TODO: チームメンバー管理機能の完成
// - プロジェクト別チーム構成の詳細表示
// - メンバー追加時のユーザー選択UI改善
// - 役割変更の一括操作機能
// - メンバー活動履歴の表示

// TODO: 通知システムの基本実装
// - 通知作成・編集・削除機能の完成
// - 通知ステータス管理（QUEUED, SENT, FAILED, CANCELLED）
// - 通知再送信機能の実装
// - 通知テンプレート機能

// Phase 2: 高級機能（2-3週間）
// TODO: ユーザー活動追跡システム
// - ユーザー別活動ログの表示
// - プロジェクト・タスク活動の追跡
// - 活動統計の生成・表示
// - 最近の活動フィード機能

// TODO: 高級検索・フィルタリング機能
// - 保存された検索条件のDB連携
// - 検索履歴の永続化
// - 高級フィルタリング（部署、スキル、日付範囲）
// - 一括操作（ユーザー有効化/無効化、削除）

// TODO: アラートルール管理の完成
// - ルールタイプ別パラメータ設定UI
// - ルールテスト機能
// - ルール実行履歴の表示
// - ルールの有効/無効切り替え

// Phase 3: 分析・レポート機能（1-2週間）
// TODO: チーム統計ダッシュボード
// - 実際のデータに基づく統計表示
// - プロジェクト別チーム構成分析
// - ユーザー別作業完了率
// - 通知システム成功率

// TODO: ユーザープロフィール詳細機能
// - 個人情報管理（名前、連絡先、部署、役職）
// - 勤務時間設定（work_hours_start/end）
// - スキル・タグ管理
// - 生産性統計（完了率、平均作業時間）

// TODO: プロジェクトチーム分析
// - プロジェクト別チーム構成分析
// - チームメンバー別作業量配分
// - チーム生産性指標
// - チームコミュニケーション分析

// 技術的実装考慮事項
// TODO: データベース制約事項の対応
// - usersテーブルの拡張情報管理（JSONフィールドまたは別テーブル）
// - 大量データ処理のためのページネーション
// - パフォーマンス最適化のためのインデックス設定

// TODO: セキュリティ・権限管理
// - ユーザー権限管理の実装
// - データアクセス制御
// - セキュアなファイルアップロード機能

// TODO: ユーザーエクスペリエンス向上
// - リアルタイム更新機能
// - 直感的なUI/UX改善
// - レスポンシブデザインの最適化
// - ローディング状態の改善

// ===== リアクティブデータ =====

// ユーザー管理
const users = ref<User[]>([]);
const isUsersLoading = ref(false);
const usersErrorMessage = ref("");

// チームメンバー管理
const teamMembers = ref<TeamMemberWithUser[]>([]);
const isTeamMembersLoading = ref(false);
const teamMembersErrorMessage = ref("");

// プロジェクトチーム情報
const projectTeams = ref<ProjectTeam[]>([]);
const isProjectTeamsLoading = ref(false);
const projectTeamsErrorMessage = ref("");

// 統計情報
const teamStats = ref<TeamStats>({
  total_users: 0,
  active_users: 0,
  total_projects: 0,
  total_tasks: 0,
  average_tasks_per_user: 0
});
const isStatsLoading = ref(false);

// ユーザー活動統計
const userActivities = ref<UserActivity[]>([]);
const isUserActivitiesLoading = ref(false);

// 通知管理
const notifications = ref<Notification[]>([]);
const isNotificationsLoading = ref(false);
const notificationsErrorMessage = ref("");

// アラートルール管理
const alertRules = ref<AlertRule[]>([]);
const isAlertRulesLoading = ref(false);
const alertRulesErrorMessage = ref("");

// 通知統計情報
const notificationStats = ref<NotificationStats>({
  total_notifications: 0,
  queued_notifications: 0,
  sent_notifications: 0,
  failed_notifications: 0,
  cancelled_notifications: 0,
  success_rate: 0
});
const isNotificationStatsLoading = ref(false);

// フィルタリング・検索
const searchQuery = ref("");
const statusFilter = ref("all"); // 'all' | 'active' | 'inactive'
const roleFilter = ref("all"); // 'all' | 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'
const notificationStatusFilter = ref("all"); // 'all' | 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED'

// 高級検索・フィルタリング
const advancedSearch = ref({
  department: "",
  position: "",
  skills: [] as string[],
  dateFrom: "",
  dateTo: "",
  taskStatus: "all",
  projectId: 0
});

// 保存された検索条件はDBから取得（将来実装予定）
const savedSearches = ref<Array<{
  id: string;
  name: string;
  filters: any;
  createdAt: string;
}>>([]);

const showAdvancedSearch = ref(false);
const showSavedSearches = ref(false);
// 検索履歴はDBから取得（将来実装予定）
const searchHistory = ref<string[]>([]);

// 一括操作関連
const selectedUsers = ref<Set<number>>(new Set());
const selectedTeamMembers = ref<Set<string>>(new Set());
const selectedNotifications = ref<Set<number>>(new Set());
const selectedAlertRules = ref<Set<number>>(new Set());
const showBulkActions = ref(false);
const bulkActionType = ref<"users" | "teamMembers" | "notifications" | "alertRules">("users");

// モーダル状態
const showUserModal = ref(false);
const showMemberModal = ref(false);
const showNotificationModal = ref(false);
const showAlertRuleModal = ref(false);
const showUserProfileModal = ref(false);
const editingUser = ref<User | null>(null);
const editingMember = ref<TeamMemberWithUser | null>(null);
const editingNotification = ref<Notification | null>(null);
const editingAlertRule = ref<AlertRule | null>(null);
const selectedUserProfile = ref<User | null>(null);

// ユーザープロフィール関連
const userProfileStats = ref<UserProfileStats | null>(null);
const userActivityLogs = ref<UserActivityLog[]>([]);
const isProfileStatsLoading = ref(false);
const isActivityLogsLoading = ref(false);

// フォームデータ
const userForm = ref({
  email: "",
  display_name: "",
  password_hash: "",
  is_active: true
});

const memberForm = ref({
  user_id: 0,
  task_id: 0,
  role: "CONTRIBUTOR" as TeamRole
});

const notificationForm = ref({
  project_id: 0,
  task_id: 0,
  to_email: "",
  subject: "",
  body_text: "",
  send_after: new Date().toISOString()
});

const alertRuleForm = ref({
  project_id: 0,
  name: "",
  rule_type: "DUE_SOON" as AlertRuleType,
  params_json: {},
  is_enabled: true,
  notify_email: ""
});

const userProfileForm = ref({
  first_name: "",
  last_name: "",
  phone: "",
  department: "",
  position: "",
  avatar_url: "",
  bio: "",
  timezone: "Asia/Tokyo",
  language: "ja",
  work_hours_start: "09:00",
  work_hours_end: "18:00",
  skills: [] as string[],
  tags: [] as string[]
});

// ===== 計算プロパティ =====

// フィルタリングされたユーザー一覧
const filteredUsers = computed(() => {
  let filtered = users.value;

  // 基本検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.display_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.first_name && user.first_name.toLowerCase().includes(query)) ||
      (user.last_name && user.last_name.toLowerCase().includes(query)) ||
      (user.department && user.department.toLowerCase().includes(query)) ||
      (user.position && user.position.toLowerCase().includes(query))
    );
  }

  // ステータスでフィルタリング
  if (statusFilter.value !== "all") {
    filtered = filtered.filter(user => {
      switch (statusFilter.value) {
        case "active":
          return user.is_active;
        case "inactive":
          return !user.is_active;
        default:
          return true;
      }
    });
  }

  // 高級検索フィルタリング
  if (advancedSearch.value.department) {
    filtered = filtered.filter(user => 
      user.department && user.department.toLowerCase().includes(advancedSearch.value.department.toLowerCase())
    );
  }

  if (advancedSearch.value.position) {
    filtered = filtered.filter(user => 
      user.position && user.position.toLowerCase().includes(advancedSearch.value.position.toLowerCase())
    );
  }

  if (advancedSearch.value.skills.length > 0) {
    filtered = filtered.filter(user => 
      user.skills && advancedSearch.value.skills.some(skill => 
        user.skills!.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
      )
    );
  }

  if (advancedSearch.value.dateFrom) {
    filtered = filtered.filter(user => 
      new Date(user.created_at) >= new Date(advancedSearch.value.dateFrom)
    );
  }

  if (advancedSearch.value.dateTo) {
    filtered = filtered.filter(user => 
      new Date(user.created_at) <= new Date(advancedSearch.value.dateTo)
    );
  }

  return filtered;
});

// フィルタリングされたチームメンバー一覧
const filteredTeamMembers = computed(() => {
  let filtered = teamMembers.value;

  // 検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(member => 
      member.user?.display_name.toLowerCase().includes(query) ||
      member.user?.email.toLowerCase().includes(query)
    );
  }

  // 役割でフィルタリング
  if (roleFilter.value !== "all") {
    filtered = filtered.filter(member => member.role === roleFilter.value);
  }

  return filtered;
});

// フィルタリングされた通知一覧
const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  // 検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(notification => 
      notification.subject.toLowerCase().includes(query) ||
      notification.to_email.toLowerCase().includes(query) ||
      notification.body_text.toLowerCase().includes(query)
    );
  }

  // ステータスでフィルタリング
  if (notificationStatusFilter.value !== "all") {
    filtered = filtered.filter(notification => notification.status === notificationStatusFilter.value);
  }

  return filtered;
});

// フィルタリングされたアラートルール一覧
const filteredAlertRules = computed(() => {
  let filtered = alertRules.value;

  // 検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(rule => 
      rule.name.toLowerCase().includes(query) ||
      rule.rule_type.toLowerCase().includes(query) ||
      (rule.notify_email && rule.notify_email.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// ===== メソッド =====

// データ読み込み
const loadUsers = async () => {
  try {
    isUsersLoading.value = true;
    usersErrorMessage.value = "";
    const result = await listUsers();
    if (result.success && result.data) {
      users.value = result.data;
    } else {
      usersErrorMessage.value = result.error || "ユーザーの読み込みに失敗しました";
      users.value = [];
    }
  } catch (error) {
    console.error("ユーザー読み込みエラー:", error);
    usersErrorMessage.value = "ユーザーの読み込みに失敗しました";
    users.value = [];
  } finally {
    isUsersLoading.value = false;
  }
};

const loadTeamMembers = async () => {
  try {
    isTeamMembersLoading.value = true;
    teamMembersErrorMessage.value = "";
    const result = await listTeamMembersWithUsers();
    if (result.success && result.data) {
      teamMembers.value = result.data;
    } else {
      teamMembersErrorMessage.value = result.error || "チームメンバーの読み込みに失敗しました";
      teamMembers.value = [];
    }
  } catch (error) {
    console.error("チームメンバー読み込みエラー:", error);
    teamMembersErrorMessage.value = "チームメンバーの読み込みに失敗しました";
    teamMembers.value = [];
  } finally {
    isTeamMembersLoading.value = false;
  }
};

const loadProjectTeams = async () => {
  try {
    isProjectTeamsLoading.value = true;
    projectTeamsErrorMessage.value = "";
    const result = await getProjectTeams();
    if (result.success && result.data) {
      projectTeams.value = result.data;
    } else {
      projectTeamsErrorMessage.value = result.error || "プロジェクトチームの読み込みに失敗しました";
      projectTeams.value = [];
    }
  } catch (error) {
    console.error("プロジェクトチーム読み込みエラー:", error);
    projectTeamsErrorMessage.value = "プロジェクトチームの読み込みに失敗しました";
    projectTeams.value = [];
  } finally {
    isProjectTeamsLoading.value = false;
  }
};

const loadTeamStats = async () => {
  try {
    isStatsLoading.value = true;
    teamStats.value = await getTeamStats();
  } catch (error) {
    console.error("チーム統計読み込みエラー:", error);
  } finally {
    isStatsLoading.value = false;
  }
};

const loadUserActivities = async () => {
  try {
    isUserActivitiesLoading.value = true;
    userActivities.value = await getUserActivityStats();
  } catch (error) {
    console.error("ユーザー活動統計読み込みエラー:", error);
  } finally {
    isUserActivitiesLoading.value = false;
  }
};

const loadNotifications = async () => {
  try {
    isNotificationsLoading.value = true;
    notificationsErrorMessage.value = "";
    const result = await listNotifications({}, 50);
    if (result.success && result.data) {
      notifications.value = result.data;
    } else {
      notificationsErrorMessage.value = result.error || "通知の読み込みに失敗しました";
      notifications.value = [];
    }
  } catch (error) {
    console.error("通知読み込みエラー:", error);
    notificationsErrorMessage.value = "通知の読み込みに失敗しました";
    notifications.value = [];
  } finally {
    isNotificationsLoading.value = false;
  }
};

const loadAlertRules = async () => {
  try {
    isAlertRulesLoading.value = true;
    alertRulesErrorMessage.value = "";
    alertRules.value = await listAlertRules();
  } catch (error) {
    console.error("アラートルール読み込みエラー:", error);
    alertRulesErrorMessage.value = "アラートルールの読み込みに失敗しました";
  } finally {
    isAlertRulesLoading.value = false;
  }
};

const loadNotificationStats = async () => {
  try {
    isNotificationStatsLoading.value = true;
    notificationStats.value = await getNotificationStats();
  } catch (error) {
    console.error("通知統計読み込みエラー:", error);
  } finally {
    isNotificationStatsLoading.value = false;
  }
};

// ユーザー管理
const handleCreateUser = async () => {
  try {
    const newUser = await createUser(userForm.value);
    if (newUser) {
      await loadUsers();
      await loadTeamStats();
      closeUserModal();
      alert("ユーザーが正常に作成されました");
    } else {
      alert("ユーザーの作成に失敗しました");
    }
  } catch (error) {
    console.error("ユーザー作成エラー:", error);
    alert("ユーザー作成中にエラーが発生しました");
  }
};

const handleUpdateUser = async () => {
  if (!editingUser.value) return;
  
  try {
    const updatedUser = await updateUser(editingUser.value.id, {
      email: userForm.value.email,
      display_name: userForm.value.display_name,
      is_active: userForm.value.is_active
    });
    
    if (updatedUser) {
      await loadUsers();
      await loadTeamStats();
      closeUserModal();
      alert("ユーザーが正常に更新されました");
    } else {
      alert("ユーザーの更新に失敗しました");
    }
  } catch (error) {
    console.error("ユーザー更新エラー:", error);
    alert("ユーザー更新中にエラーが発生しました");
  }
};

const handleEditUser = (user: User) => {
  editingUser.value = user;
  userForm.value = {
    email: user.email,
    display_name: user.display_name,
    password_hash: "",
    is_active: user.is_active
  };
  showUserModal.value = true;
};

// チームメンバー管理
const handleAddTeamMember = async () => {
  try {
    const newMember = await addTeamMember(memberForm.value);
    if (newMember) {
      await loadTeamMembers();
      await loadProjectTeams();
      closeMemberModal();
      alert("チームメンバーが正常に追加されました");
    } else {
      alert("チームメンバーの追加に失敗しました");
    }
  } catch (error) {
    console.error("チームメンバー追加エラー:", error);
    alert("チームメンバー追加中にエラーが発生しました");
  }
};

const handleUpdateMemberRole = async (userId: number, taskId: number, newRole: TeamRole) => {
  try {
    const updatedMember = await updateTeamMemberRole(userId, taskId, { role: newRole });
    if (updatedMember) {
      await loadTeamMembers();
      await loadProjectTeams();
      alert("チームメンバーの役割が正常に更新されました");
    } else {
      alert("チームメンバーの役割更新に失敗しました");
    }
  } catch (error) {
    console.error("チームメンバー役割更新エラー:", error);
    alert("チームメンバー役割更新中にエラーが発生しました");
  }
};

const handleRemoveTeamMember = async (userId: number, taskId: number) => {
  if (!confirm("このチームメンバーを削除しますか？")) return;
  
  try {
    const success = await removeTeamMember(userId, taskId);
    if (success) {
      await loadTeamMembers();
      await loadProjectTeams();
      alert("チームメンバーが正常に削除されました");
    } else {
      alert("チームメンバーの削除に失敗しました");
    }
  } catch (error) {
    console.error("チームメンバー削除エラー:", error);
    alert("チームメンバー削除中にエラーが発生しました");
  }
};

// 通知管理
const handleCreateNotification = async () => {
  try {
    const newNotification = await createNotification(notificationForm.value);
    if (newNotification) {
      await loadNotifications();
      await loadNotificationStats();
      closeNotificationModal();
      alert("通知が正常に作成されました");
    } else {
      alert("通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("通知作成エラー:", error);
    alert("通知作成中にエラーが発生しました");
  }
};

const handleResendNotification = async (id: number) => {
  try {
    const success = await resendNotification(id);
    if (success) {
      await loadNotifications();
      await loadNotificationStats();
      alert("通知の再送信が完了しました");
    } else {
      alert("通知の再送信に失敗しました");
    }
  } catch (error) {
    console.error("通知再送信エラー:", error);
    alert("通知再送信中にエラーが発生しました");
  }
};

const handleDeleteNotification = async (id: number) => {
  if (!confirm("この通知を削除しますか？")) return;
  
  try {
    const success = await deleteNotification(id);
    if (success) {
      await loadNotifications();
      await loadNotificationStats();
      alert("通知が正常に削除されました");
    } else {
      alert("通知の削除に失敗しました");
    }
  } catch (error) {
    console.error("通知削除エラー:", error);
    alert("通知削除中にエラーが発生しました");
  }
};

// アラートルール管理
const handleCreateAlertRule = async () => {
  try {
    const newAlertRule = await createAlertRule(alertRuleForm.value);
    if (newAlertRule) {
      await loadAlertRules();
      closeAlertRuleModal();
      alert("アラートルールが正常に作成されました");
    } else {
      alert("アラートルールの作成に失敗しました");
    }
  } catch (error) {
    console.error("アラートルール作成エラー:", error);
    alert("アラートルール作成中にエラーが発生しました");
  }
};

const handleUpdateAlertRule = async () => {
  if (!editingAlertRule.value) return;
  
  try {
    const updatedAlertRule = await updateAlertRule(editingAlertRule.value.id, {
      name: alertRuleForm.value.name,
      rule_type: alertRuleForm.value.rule_type,
      params_json: alertRuleForm.value.params_json,
      is_enabled: alertRuleForm.value.is_enabled,
      notify_email: alertRuleForm.value.notify_email
    });
    
    if (updatedAlertRule) {
      await loadAlertRules();
      closeAlertRuleModal();
      alert("アラートルールが正常に更新されました");
    } else {
      alert("アラートルールの更新に失敗しました");
    }
  } catch (error) {
    console.error("アラートルール更新エラー:", error);
    alert("アラートルール更新中にエラーが発生しました");
  }
};

const handleDeleteAlertRule = async (id: number) => {
  if (!confirm("このアラートルールを削除しますか？")) return;
  
  try {
    const success = await deleteAlertRule(id);
    if (success) {
      await loadAlertRules();
      alert("アラートルールが正常に削除されました");
    } else {
      alert("アラートルールの削除に失敗しました");
    }
  } catch (error) {
    console.error("アラートルール削除エラー:", error);
    alert("アラートルール削除中にエラーが発生しました");
  }
};

const handleEditAlertRule = (alertRule: AlertRule) => {
  editingAlertRule.value = alertRule;
  alertRuleForm.value = {
    project_id: alertRule.project_id,
    name: alertRule.name,
    rule_type: alertRule.rule_type,
    params_json: alertRule.params_json || {},
    is_enabled: alertRule.is_enabled,
    notify_email: alertRule.notify_email || ""
  };
  showAlertRuleModal.value = true;
};

// ユーザープロフィール管理
const handleViewUserProfile = async (user: User) => {
  selectedUserProfile.value = user;
  showUserProfileModal.value = true;
  
  // プロフィール統計と活動履歴を読み込み
  await Promise.all([
    loadUserProfileStats(user.id),
    loadUserActivityLogs(user.id)
  ]);
};

const handleUpdateUserProfile = async () => {
  if (!selectedUserProfile.value) return;
  
  try {
    const updatedUser = await updateUserProfile(selectedUserProfile.value.id, userProfileForm.value);
    if (updatedUser) {
      await loadUsers();
      await loadUserProfileStats(selectedUserProfile.value.id);
      alert("プロフィールが正常に更新されました");
    } else {
      alert("プロフィールの更新に失敗しました");
    }
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    alert("プロフィール更新中にエラーが発生しました");
  }
};

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !selectedUserProfile.value) return;
  
  try {
    const avatarUrl = await uploadUserAvatar(selectedUserProfile.value.id, file);
    if (avatarUrl) {
      userProfileForm.value.avatar_url = avatarUrl;
      alert("アバターが正常にアップロードされました");
    } else {
      alert("アバターのアップロードに失敗しました");
    }
  } catch (error) {
    console.error("アバターアップロードエラー:", error);
    alert("アバターアップロード中にエラーが発生しました");
  }
};

const loadUserProfileStats = async (userId: number) => {
  try {
    isProfileStatsLoading.value = true;
    userProfileStats.value = await getUserProfileStats(userId);
  } catch (error) {
    console.error("プロフィール統計読み込みエラー:", error);
  } finally {
    isProfileStatsLoading.value = false;
  }
};

const loadUserActivityLogs = async (userId: number) => {
  try {
    isActivityLogsLoading.value = true;
    userActivityLogs.value = await getUserActivityLogs(userId);
  } catch (error) {
    console.error("活動履歴読み込みエラー:", error);
  } finally {
    isActivityLogsLoading.value = false;
  }
};

// 高級検索・フィルタリング管理
const handleAdvancedSearch = async () => {
  try {
    // 高級検索を実行
    const results = await searchUsers(searchQuery.value, {
      department: advancedSearch.value.department || undefined,
      position: advancedSearch.value.position || undefined,
      skills: advancedSearch.value.skills.length > 0 ? advancedSearch.value.skills : undefined,
      is_active: statusFilter.value === "active" ? true : statusFilter.value === "inactive" ? false : undefined
    });
    
    // 検索結果を適用（実際の実装では、検索結果を状態に反映）
    console.log("高級検索結果:", results);
    
    // 検索履歴はDBに保存（将来実装予定）
    // 現在はローカル配列を使用
    if (searchQuery.value.trim() && !searchHistory.value.includes(searchQuery.value)) {
      searchHistory.value.unshift(searchQuery.value);
      if (searchHistory.value.length > 10) {
        searchHistory.value = searchHistory.value.slice(0, 10);
      }
    }
    
    showAdvancedSearch.value = false;
  } catch (error) {
    console.error("高級検索エラー:", error);
    alert("検索中にエラーが発生しました");
  }
};

const handleSaveSearch = () => {
  const searchName = prompt("検索条件の名前を入力してください:");
  if (!searchName) return;
  
  const searchId = `search_${Date.now()}`;
  const newSearch = {
    id: searchId,
    name: searchName,
    filters: {
      searchQuery: searchQuery.value,
      statusFilter: statusFilter.value,
      roleFilter: roleFilter.value,
      notificationStatusFilter: notificationStatusFilter.value,
      advancedSearch: { ...advancedSearch.value }
    },
    createdAt: new Date().toISOString()
  };
  
  // 保存された検索条件はDBに保存（将来実装予定）
  // 現在はローカル配列を使用
  savedSearches.value.unshift(newSearch);
  if (savedSearches.value.length > 20) {
    savedSearches.value = savedSearches.value.slice(0, 20);
  }
  
  alert("検索条件が保存されました");
};

const handleLoadSavedSearch = (savedSearch: any) => {
  const filters = savedSearch.filters;
  searchQuery.value = filters.searchQuery || "";
  statusFilter.value = filters.statusFilter || "all";
  roleFilter.value = filters.roleFilter || "all";
  notificationStatusFilter.value = filters.notificationStatusFilter || "all";
  advancedSearch.value = { ...filters.advancedSearch };
  
  showSavedSearches.value = false;
  alert(`検索条件「${savedSearch.name}」を読み込みました`);
};

const handleDeleteSavedSearch = (searchId: string) => {
  if (confirm("この検索条件を削除しますか？")) {
    savedSearches.value = savedSearches.value.filter(s => s.id !== searchId);
    alert("検索条件が削除されました");
  }
};

const handleClearAdvancedSearch = () => {
  advancedSearch.value = {
    department: "",
    position: "",
    skills: [],
    dateFrom: "",
    dateTo: "",
    taskStatus: "all",
    projectId: 0
  };
};

const handleSearchFromHistory = (query: string) => {
  searchQuery.value = query;
  showSavedSearches.value = false;
};

const handleSkillsInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const skillsText = target.value.trim();
  if (skillsText) {
    advancedSearch.value.skills = skillsText.split(',').map(skill => skill.trim()).filter(Boolean);
  }
};

// 一括操作管理
const handleSelectUser = (userId: number, checked: boolean) => {
  if (checked) {
    selectedUsers.value.add(userId);
  } else {
    selectedUsers.value.delete(userId);
  }
  updateBulkActionsVisibility();
};

const handleSelectAllUsers = (checked: boolean) => {
  if (checked) {
    filteredUsers.value.forEach(user => selectedUsers.value.add(user.id));
  } else {
    selectedUsers.value.clear();
  }
  updateBulkActionsVisibility();
};

const handleSelectTeamMember = (memberKey: string, checked: boolean) => {
  if (checked) {
    selectedTeamMembers.value.add(memberKey);
  } else {
    selectedTeamMembers.value.delete(memberKey);
  }
  updateBulkActionsVisibility();
};

const handleSelectAllTeamMembers = (checked: boolean) => {
  if (checked) {
    filteredTeamMembers.value.forEach(member => 
      selectedTeamMembers.value.add(`${member.user_id}-${member.task_id}`)
    );
  } else {
    selectedTeamMembers.value.clear();
  }
  updateBulkActionsVisibility();
};

const handleSelectNotification = (notificationId: number, checked: boolean) => {
  if (checked) {
    selectedNotifications.value.add(notificationId);
  } else {
    selectedNotifications.value.delete(notificationId);
  }
  updateBulkActionsVisibility();
};

const handleSelectAllNotifications = (checked: boolean) => {
  if (checked) {
    filteredNotifications.value.forEach(notification => selectedNotifications.value.add(notification.id));
  } else {
    selectedNotifications.value.clear();
  }
  updateBulkActionsVisibility();
};

const handleSelectAlertRule = (ruleId: number, checked: boolean) => {
  if (checked) {
    selectedAlertRules.value.add(ruleId);
  } else {
    selectedAlertRules.value.delete(ruleId);
  }
  updateBulkActionsVisibility();
};

const handleSelectAllAlertRules = (checked: boolean) => {
  if (checked) {
    filteredAlertRules.value.forEach(rule => selectedAlertRules.value.add(rule.id));
  } else {
    selectedAlertRules.value.clear();
  }
  updateBulkActionsVisibility();
};

const updateBulkActionsVisibility = () => {
  const hasSelections = selectedUsers.value.size > 0 || 
                       selectedTeamMembers.value.size > 0 || 
                       selectedNotifications.value.size > 0 || 
                       selectedAlertRules.value.size > 0;
  showBulkActions.value = hasSelections;
};

const handleBulkDeleteUsers = async () => {
  if (selectedUsers.value.size === 0) return;
  
  const confirmMessage = `選択された${selectedUsers.value.size}名のユーザーを削除しますか？この操作は取り消せません。`;
  if (!confirm(confirmMessage)) return;
  
  try {
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of selectedUsers.value) {
      // TODO: deleteUser 関数を実装してDBから削除
      // 現在は仮実装としてログ出力のみ
      console.log(`ユーザー削除: ${userId}`);
      successCount++;
    }
    
    if (successCount > 0) {
      await loadUsers();
      await loadTeamStats();
      selectedUsers.value.clear();
      updateBulkActionsVisibility();
      alert(`${successCount}名のユーザーが削除されました`);
    }
  } catch (error) {
    console.error("一括ユーザー削除エラー:", error);
    alert("一括削除中にエラーが発生しました");
  }
};

const handleBulkActivateUsers = async () => {
  if (selectedUsers.value.size === 0) return;
  
  try {
    let successCount = 0;
    
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId);
      if (user && !user.is_active) {
        const updatedUser = await updateUser(userId, { is_active: true });
        if (updatedUser) successCount++;
      }
    }
    
    if (successCount > 0) {
      await loadUsers();
      await loadTeamStats();
      selectedUsers.value.clear();
      updateBulkActionsVisibility();
      alert(`${successCount}名のユーザーがアクティブになりました`);
    }
  } catch (error) {
    console.error("一括ユーザーアクティブ化エラー:", error);
    alert("一括アクティブ化中にエラーが発生しました");
  }
};

const handleBulkDeactivateUsers = async () => {
  if (selectedUsers.value.size === 0) return;
  
  try {
    let successCount = 0;
    
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId);
      if (user && user.is_active) {
        const updatedUser = await updateUser(userId, { is_active: false });
        if (updatedUser) successCount++;
      }
    }
    
    if (successCount > 0) {
      await loadUsers();
      await loadTeamStats();
      selectedUsers.value.clear();
      updateBulkActionsVisibility();
      alert(`${successCount}名のユーザーが非アクティブになりました`);
    }
  } catch (error) {
    console.error("一括ユーザー非アクティブ化エラー:", error);
    alert("一括非アクティブ化中にエラーが発生しました");
  }
};

const handleBulkDeleteNotifications = async () => {
  if (selectedNotifications.value.size === 0) return;
  
  const confirmMessage = `選択された${selectedNotifications.value.size}件の通知を削除しますか？`;
  if (!confirm(confirmMessage)) return;
  
  try {
    let successCount = 0;
    
    for (const notificationId of selectedNotifications.value) {
      const success = await deleteNotification(notificationId);
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      await loadNotifications();
      await loadNotificationStats();
      selectedNotifications.value.clear();
      updateBulkActionsVisibility();
      alert(`${successCount}件の通知が削除されました`);
    }
  } catch (error) {
    console.error("一括通知削除エラー:", error);
    alert("一括削除中にエラーが発生しました");
  }
};

const handleBulkResendNotifications = async () => {
  if (selectedNotifications.value.size === 0) return;
  
  try {
    let successCount = 0;
    
    for (const notificationId of selectedNotifications.value) {
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification && notification.status === "FAILED") {
        const success = await resendNotification(notificationId);
        if (success) successCount++;
      }
    }
    
    if (successCount > 0) {
      await loadNotifications();
      await loadNotificationStats();
      selectedNotifications.value.clear();
      updateBulkActionsVisibility();
      alert(`${successCount}件の通知が再送信されました`);
    }
  } catch (error) {
    console.error("一括通知再送信エラー:", error);
    alert("一括再送信中にエラーが発生しました");
  }
};

const handleBulkDeleteAlertRules = async () => {
  if (selectedAlertRules.value.size === 0) return;
  
  const confirmMessage = `選択された${selectedAlertRules.value.size}件のアラートルールを削除しますか？`;
  if (!confirm(confirmMessage)) return;
  
  try {
    let successCount = 0;
    
    for (const ruleId of selectedAlertRules.value) {
      const success = await deleteAlertRule(ruleId);
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      await loadAlertRules();
      selectedAlertRules.value.clear();
      updateBulkActionsVisibility();
      alert(`${successCount}件のアラートルールが削除されました`);
    }
  } catch (error) {
    console.error("一括アラートルール削除エラー:", error);
    alert("一括削除中にエラーが発生しました");
  }
};

const clearAllSelections = () => {
  selectedUsers.value.clear();
  selectedTeamMembers.value.clear();
  selectedNotifications.value.clear();
  selectedAlertRules.value.clear();
  updateBulkActionsVisibility();
};

// モーダル管理
const openUserModal = () => {
  editingUser.value = null;
  userForm.value = {
    email: "",
    display_name: "",
    password_hash: "",
    is_active: true
  };
  showUserModal.value = true;
};

const closeUserModal = () => {
  showUserModal.value = false;
  editingUser.value = null;
};

const openMemberModal = () => {
  editingMember.value = null;
  memberForm.value = {
    user_id: 0,
    task_id: 0,
    role: "CONTRIBUTOR"
  };
  showMemberModal.value = true;
};

const closeMemberModal = () => {
  showMemberModal.value = false;
  editingMember.value = null;
};

const openNotificationModal = () => {
  editingNotification.value = null;
  notificationForm.value = {
    project_id: 0,
    task_id: 0,
    to_email: "",
    subject: "",
    body_text: "",
    send_after: new Date().toISOString()
  };
  showNotificationModal.value = true;
};

const closeNotificationModal = () => {
  showNotificationModal.value = false;
  editingNotification.value = null;
};

const openAlertRuleModal = () => {
  editingAlertRule.value = null;
  alertRuleForm.value = {
    project_id: 0,
    name: "",
    rule_type: "DUE_SOON",
    params_json: {},
    is_enabled: true,
    notify_email: ""
  };
  showAlertRuleModal.value = true;
};

const closeAlertRuleModal = () => {
  showAlertRuleModal.value = false;
  editingAlertRule.value = null;
};

const openUserProfileModal = (user: User) => {
  selectedUserProfile.value = user;
  userProfileForm.value = {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone: user.phone || "",
    department: user.department || "",
    position: user.position || "",
    avatar_url: user.avatar_url || "",
    bio: user.bio || "",
    timezone: user.timezone || "Asia/Tokyo",
    language: user.language || "ja",
    work_hours_start: user.work_hours_start || "09:00",
    work_hours_end: user.work_hours_end || "18:00",
    skills: user.skills || [],
    tags: user.tags || []
  };
  showUserProfileModal.value = true;
};

const closeUserProfileModal = () => {
  showUserProfileModal.value = false;
  selectedUserProfile.value = null;
  userProfileStats.value = null;
  userActivityLogs.value = [];
};

// フィルタリセット
const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
  roleFilter.value = "all";
  notificationStatusFilter.value = "all";
  handleClearAdvancedSearch();
};

// フィルター更新ハンドラー
const handleFilterUpdate = (key: string, value: any) => {
  if (key === 'status') {
    statusFilter.value = value;
  } else if (key === 'role') {
    roleFilter.value = value;
  }
};

// 相対時間表示
const getRelativeTime = (timestamp: string): string => {
  if (!timestamp) return "未活動";
  
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return "たった今";
};

// ヘッダーアクションを生成する関数
const getHeaderActions = () => {
  return [
    {
      label: '新しいユーザー',
      icon: 'person_add',
      variant: 'primary',
      onClick: () => {
        // ユーザー作成モーダルを開く
        showUserModal.value = true;
      }
    },
    {
      label: 'チームメンバー追加',
      icon: 'group_add',
      variant: 'outline-primary',
      onClick: () => {
        // チームメンバー追加モーダルを開く
        showMemberModal.value = true;
      }
    }
  ];
};

// 統計カードデータを生成する関数
const getStatCardsData = () => {
  return [
    {
      label: '総ユーザー数',
      value: teamStats.value.total_users,
      icon: 'group',
      color: 'primary' as const,
      footer: `${teamStats.value.active_users} アクティブ`
    },
    {
      label: 'プロジェクト数',
      value: teamStats.value.total_projects,
      icon: 'work',
      color: 'success' as const,
      footer: `${teamStats.value.total_tasks} タスク`
    },
    {
      label: '平均タスク数',
      value: teamStats.value.average_tasks_per_user,
      icon: 'analytics',
      color: 'info' as const,
      footer: 'ユーザーあたり'
    },
    {
      label: 'アクティブ率',
      value: `${teamStats.value.total_users > 0 ? Math.round((teamStats.value.active_users / teamStats.value.total_users) * 100) : 0}%`,
      icon: 'trending_up',
      color: 'warning' as const,
      footer: 'ユーザー利用率'
    }
  ];
};

// ユーザーの重要度を取得（ログイン回数や最終ログイン日時を基に判定）
const getUserPriority = (user: User): "LOW" | "MEDIUM" | "HIGH" | "URGENT" => {
  // ログイン回数が多く、最近ログインしているユーザーを高優先度とする
  const loginCount = user.login_count || 0;
  const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;
  const now = new Date();
  
  if (loginCount > 50 && lastLogin && (now.getTime() - lastLogin.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    return "URGENT"; // アクティブユーザー
  } else if (loginCount > 20 && lastLogin && (now.getTime() - lastLogin.getTime()) < 30 * 24 * 60 * 60 * 1000) {
    return "HIGH"; // 定期的なユーザー
  } else if (loginCount > 5) {
    return "MEDIUM"; // 時々使用するユーザー
  } else {
    return "LOW"; // 新規または非アクティブユーザー
  }
};

// 初期化
onMounted(async () => {
  console.log("チーム管理ページが初期化されました");
  await Promise.all([
    loadUsers(),
    loadTeamMembers(),
    loadProjectTeams(),
    loadTeamStats(),
    loadUserActivities(),
    loadNotifications(),
    loadAlertRules(),
    loadNotificationStats()
  ]);
});
</script>

<template>
  <!-- チーム管理ページ -->
  <div class="team-management">
    <!-- ページヘッダー -->
    <PageHeader
      title="チーム管理"
      description="ユーザー管理、チームメンバー管理、権限管理を行います。"
      :actions="getHeaderActions()"
    />

    <!-- 統計カード -->
    <StatCards :items="getStatCardsData()" />

    <!-- 通知統計カード -->
    <div class="row mb-4">
      <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
        <div class="card">
          <div class="card-header p-2 ps-3">
            <div class="d-flex justify-content-between">
              <div>
                <p class="text-sm mb-0 text-capitalize">総通知数</p>
                <h4 class="mb-0">{{ notificationStats.total_notifications }}</h4>
              </div>
              <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
                <i class="material-symbols-rounded opacity-10">notifications</i>
              </div>
            </div>
          </div>
          <hr class="dark horizontal my-0">
          <div class="card-footer p-2 ps-3">
            <p class="mb-0 text-sm">
              <span class="text-warning font-weight-bolder">{{ notificationStats.queued_notifications }}</span> 送信待ち
            </p>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
        <div class="card">
          <div class="card-header p-2 ps-3">
            <div class="d-flex justify-content-between">
              <div>
                <p class="text-sm mb-0 text-capitalize">送信済み</p>
                <h4 class="mb-0">{{ notificationStats.sent_notifications }}</h4>
              </div>
              <div class="icon icon-md icon-shape bg-gradient-success shadow-dark shadow text-center border-radius-lg">
                <i class="material-symbols-rounded opacity-10">check_circle</i>
              </div>
            </div>
          </div>
          <hr class="dark horizontal my-0">
          <div class="card-footer p-2 ps-3">
            <p class="mb-0 text-sm">
              <span class="text-danger font-weight-bolder">{{ notificationStats.failed_notifications }}</span> 失敗
            </p>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
        <div class="card">
          <div class="card-header p-2 ps-3">
            <div class="d-flex justify-content-between">
              <div>
                <p class="text-sm mb-0 text-capitalize">成功率</p>
                <h4 class="mb-0">{{ notificationStats.success_rate }}%</h4>
              </div>
              <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
                <i class="material-symbols-rounded opacity-10">analytics</i>
              </div>
            </div>
          </div>
          <hr class="dark horizontal my-0">
          <div class="card-footer p-2 ps-3">
            <p class="mb-0 text-sm">
              <span class="text-info font-weight-bolder">通知配信効率</span>
            </p>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-sm-6">
        <div class="card">
          <div class="card-header p-2 ps-3">
            <div class="d-flex justify-content-between">
              <div>
                <p class="text-sm mb-0 text-capitalize">アラートルール</p>
                <h4 class="mb-0">{{ alertRules.length }}</h4>
              </div>
              <div class="icon icon-md icon-shape bg-gradient-warning shadow-dark shadow text-center border-radius-lg">
                <i class="material-symbols-rounded opacity-10">rule</i>
              </div>
            </div>
          </div>
          <hr class="dark horizontal my-0">
          <div class="card-footer p-2 ps-3">
            <p class="mb-0 text-sm">
              <span class="text-success font-weight-bolder">アクティブ</span> ルール
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- フィルタリング・アクションパネル -->
    <div class="row mb-4">
      <div class="col-lg-8 col-md-12">
        <div class="card">
          <CardHeader title="フィルタリング" subtitle="ユーザー検索とフィルタリング">
            <template #actions>
              <div class="btn-group" role="group">
                <button 
                  class="btn btn-sm btn-outline-primary"
                  @click="showAdvancedSearch = !showAdvancedSearch"
                >
                  <i class="material-symbols-rounded me-1">tune</i>
                  高級検索
                </button>
                <button 
                  class="btn btn-sm btn-outline-info"
                  @click="showSavedSearches = !showSavedSearches"
                >
                  <i class="material-symbols-rounded me-1">bookmark</i>
                  保存済み
                </button>
                <button 
                  class="btn btn-sm btn-outline-success"
                  @click="handleSaveSearch"
                >
                  <i class="material-symbols-rounded me-1">save</i>
                  保存
                </button>
              </div>
            </template>
          </CardHeader>
          <div class="card-body">
            <!-- 基本検索 -->
            <ActionBar
              :search-query="searchQuery"
              :search-placeholder="'ユーザー名、メール、部署、役職...'"
              @update:search-query="searchQuery = $event"
              :filters="[
                {
                  key: 'status',
                  label: 'ステータス',
                  type: 'select',
                  value: statusFilter,
                  options: [
                    { value: 'all', label: 'すべて' },
                    { value: 'active', label: 'アクティブ' },
                    { value: 'inactive', label: '非アクティブ' }
                  ]
                },
                {
                  key: 'role',
                  label: '役割',
                  type: 'select',
                  value: roleFilter,
                  options: [
                    { value: 'all', label: 'すべて' },
                    { value: 'OWNER', label: 'オーナー' },
                    { value: 'CONTRIBUTOR', label: '貢献者' },
                    { value: 'REVIEWER', label: 'レビューアー' }
                  ]
                }
              ]"
              @update:filter="handleFilterUpdate"
              :actions="[
                {
                  label: 'リセット',
                  icon: 'refresh',
                  variant: 'outline-secondary',
                  onClick: clearFilters
                }
              ]"
            />

            <!-- 高級検索パネル -->
            <div v-if="showAdvancedSearch" class="advanced-search-panel mt-3 p-3 border rounded">
              <h6 class="mb-3">高級検索オプション</h6>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label text-sm">部署</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="部署名で検索"
                    v-model="advancedSearch.department"
                  >
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label text-sm">役職</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="役職で検索"
                    v-model="advancedSearch.position"
                  >
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label text-sm">スキル</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="スキルで検索（カンマ区切り）"
                    @blur="handleSkillsInput"
                    ref="skillsInput"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label text-sm">登録日（開始）</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="advancedSearch.dateFrom"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label text-sm">登録日（終了）</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="advancedSearch.dateTo"
                  >
                </div>
              </div>
              <div class="d-flex justify-content-end">
                <button 
                  class="btn btn-sm btn-primary me-2"
                  @click="handleAdvancedSearch"
                >
                  検索実行
                </button>
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  @click="handleClearAdvancedSearch"
                >
                  クリア
                </button>
              </div>
            </div>

            <!-- 保存済み検索パネル -->
            <div v-if="showSavedSearches" class="saved-searches-panel mt-3 p-3 border rounded">
              <h6 class="mb-3">保存済み検索条件</h6>
              <div v-if="savedSearches.length > 0" class="row">
                <div 
                  v-for="search in savedSearches" 
                  :key="search.id"
                  class="col-md-6 mb-2"
                >
                  <div class="card">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-0 text-sm">{{ search.name }}</h6>
                          <small class="text-muted">{{ new Date(search.createdAt).toLocaleDateString('ja-JP') }}</small>
                        </div>
                        <div class="btn-group btn-group-sm">
                          <button 
                            class="btn btn-outline-primary"
                            @click="handleLoadSavedSearch(search)"
                          >
                            読み込み
                          </button>
                          <button 
                            class="btn btn-outline-danger"
                            @click="handleDeleteSavedSearch(search.id)"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted py-3">
                保存済みの検索条件がありません
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4 col-md-12">
        <div class="card">
          <CardHeader title="クイックアクション" subtitle="よく使用する操作" />
          <div class="card-body">
            <div class="row">
              <div class="col-6 mb-3">
                <button 
                  class="btn btn-sm bg-gradient-primary mb-0 w-100"
                  @click="openUserModal"
                >
                  <i class="material-symbols-rounded me-1">person_add</i>
                  ユーザー追加
                </button>
              </div>
              <div class="col-6 mb-3">
                <button 
                  class="btn btn-sm bg-gradient-success mb-0 w-100"
                  @click="openMemberModal"
                >
                  <i class="material-symbols-rounded me-1">group_add</i>
                  メンバー追加
                </button>
              </div>
              <div class="col-6 mb-3">
                <button 
                  class="btn btn-sm bg-gradient-info mb-0 w-100"
                  @click="openNotificationModal"
                >
                  <i class="material-symbols-rounded me-1">notifications</i>
                  通知作成
                </button>
              </div>
              <div class="col-6 mb-3">
                <button 
                  class="btn btn-sm bg-gradient-warning mb-0 w-100"
                  @click="openAlertRuleModal"
                >
                  <i class="material-symbols-rounded me-1">rule</i>
                  ルール作成
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ユーザー一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>ユーザー一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-users text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">システムユーザー</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredUsers.length }}名</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- テーブルコントロール -->
            <div class="p-3">
              <TableControls
                :search="searchQuery"
                :searchable="true"
                search-placeholder="ユーザー名、メールアドレスで検索..."
                @update:search="(v: string) => searchQuery = v"
                @reset="() => searchQuery = ''"
              />
            </div>
            
            <!-- ローディング状態 -->
            <div v-if="isUsersLoading" class="text-center py-4">
              <LoadingSpinner message="ユーザーデータを読み込み中..." />
            </div>
            
            <!-- エラー表示 -->
            <div v-else-if="usersErrorMessage" class="alert alert-danger mx-3" role="alert">
              {{ usersErrorMessage }}
            </div>
            
            <!-- ユーザー一覧テーブル -->
            <div v-else-if="filteredUsers.length > 0" class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input"
                        @change="handleSelectAllUsers(($event.target as HTMLInputElement).checked)"
                        :checked="selectedUsers.size === filteredUsers.length && filteredUsers.length > 0"
                        :indeterminate="selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length"
                      >
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ユーザー</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">メールアドレス</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ステータス</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">重要度</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">登録日</th>
                    <th class="text-secondary opacity-7"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input"
                        :checked="selectedUsers.has(user.id)"
                        @change="handleSelectUser(user.id, ($event.target as HTMLInputElement).checked)"
                      >
                    </td>
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ user.display_name }}</h6>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">{{ user.email }}</p>
                    </td>
                    <td class="align-middle text-center">
                      <StatusBadge :status="user.is_active ? 'active' : 'inactive'" />
                    </td>
                    <td class="align-middle text-center">
                      <PriorityBadge :priority="getUserPriority(user)" />
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ new Date(user.created_at).toLocaleDateString('ja-JP') }}
                      </span>
                    </td>
                    <td class="align-middle">
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-sm bg-gradient-info mb-0" 
                          @click="handleViewUserProfile(user)"
                        >
                          プロフィール
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-primary mb-0" 
                          @click="handleEditUser(user)"
                        >
                          編集
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- ユーザーが存在しない場合 -->
            <div v-else class="p-3">
              <EmptyState 
                icon="person_off" 
                title="ユーザーが見つかりません" 
                subtitle="検索条件を変更するか、新しいユーザーを作成してください"
              >
                <template #actions>
                  <button class="btn bg-gradient-primary" @click="showUserModal = true">
                    <i class="material-symbols-rounded me-1">add</i>
                    新しいユーザーを作成
                  </button>
                </template>
              </EmptyState>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 一括操作パネル -->
    <div v-if="showBulkActions" class="row mb-4">
      <div class="col-12">
        <div class="card border-primary">
          <div class="card-header bg-gradient-primary text-white">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">
                <i class="material-symbols-rounded me-2">select_all</i>
                一括操作
              </h6>
              <button 
                class="btn btn-sm btn-outline-light"
                @click="clearAllSelections"
              >
                <i class="material-symbols-rounded me-1">clear</i>
                選択解除
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <!-- ユーザー一括操作 -->
              <div v-if="selectedUsers.size > 0" class="col-md-4 mb-3">
                <h6 class="text-primary mb-2">
                  <i class="material-symbols-rounded me-1">person</i>
                  ユーザー ({{ selectedUsers.size }}名選択中)
                </h6>
                <div class="btn-group w-100" role="group">
                  <button 
                    class="btn btn-sm btn-success"
                    @click="handleBulkActivateUsers"
                  >
                    <i class="material-symbols-rounded me-1">check_circle</i>
                    アクティブ化
                  </button>
                  <button 
                    class="btn btn-sm btn-warning"
                    @click="handleBulkDeactivateUsers"
                  >
                    <i class="material-symbols-rounded me-1">pause_circle</i>
                    非アクティブ化
                  </button>
                  <button 
                    class="btn btn-sm btn-danger"
                    @click="handleBulkDeleteUsers"
                  >
                    <i class="material-symbols-rounded me-1">delete</i>
                    削除
                  </button>
                </div>
              </div>

              <!-- 通知一括操作 -->
              <div v-if="selectedNotifications.size > 0" class="col-md-4 mb-3">
                <h6 class="text-info mb-2">
                  <i class="material-symbols-rounded me-1">notifications</i>
                  通知 ({{ selectedNotifications.size }}件選択中)
                </h6>
                <div class="btn-group w-100" role="group">
                  <button 
                    class="btn btn-sm btn-warning"
                    @click="handleBulkResendNotifications"
                  >
                    <i class="material-symbols-rounded me-1">refresh</i>
                    再送信
                  </button>
                  <button 
                    class="btn btn-sm btn-danger"
                    @click="handleBulkDeleteNotifications"
                  >
                    <i class="material-symbols-rounded me-1">delete</i>
                    削除
                  </button>
                </div>
              </div>

              <!-- アラートルール一括操作 -->
              <div v-if="selectedAlertRules.size > 0" class="col-md-4 mb-3">
                <h6 class="text-warning mb-2">
                  <i class="material-symbols-rounded me-1">rule</i>
                  アラートルール ({{ selectedAlertRules.size }}件選択中)
                </h6>
                <div class="btn-group w-100" role="group">
                  <button 
                    class="btn btn-sm btn-danger"
                    @click="handleBulkDeleteAlertRules"
                  >
                    <i class="material-symbols-rounded me-1">delete</i>
                    削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- チームメンバー一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>チームメンバー一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-user-friends text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">タスクメンバー</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredTeamMembers.length }}名</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング状態 -->
            <div v-if="isTeamMembersLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <p class="text-sm text-secondary mt-2">チームメンバーデータを読み込み中...</p>
            </div>
            
            <!-- エラー表示 -->
            <div v-else-if="teamMembersErrorMessage" class="alert alert-danger mx-3" role="alert">
              {{ teamMembersErrorMessage }}
            </div>
            
            <!-- チームメンバー一覧テーブル -->
            <div v-else class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">メンバー</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">タスクID</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">役割</th>
                    <th class="text-secondary opacity-7"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in filteredTeamMembers" :key="`${member.user_id}-${member.task_id}`">
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ member.user?.display_name || '未設定' }}</h6>
                          <p class="text-xs text-secondary mb-0">{{ member.user?.email || '' }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">{{ member.task_id }}</p>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="`badge ${TEAM_ROLE_COLORS[member.role]}`">
                        {{ TEAM_ROLE_LABELS[member.role] }}
                      </span>
                    </td>
                    <td class="align-middle">
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-sm bg-gradient-info mb-0" 
                          @click="handleUpdateMemberRole(member.user_id, member.task_id, 'OWNER')"
                          :disabled="member.role === 'OWNER'"
                        >
                          オーナー
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-primary mb-0" 
                          @click="handleUpdateMemberRole(member.user_id, member.task_id, 'CONTRIBUTOR')"
                          :disabled="member.role === 'CONTRIBUTOR'"
                        >
                          貢献者
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-warning mb-0" 
                          @click="handleRemoveTeamMember(member.user_id, member.task_id)"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- プロジェクト別チーム情報 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>プロジェクト別チーム情報</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-project-diagram text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">プロジェクト</span>ごとのチーム構成
                  <span class="badge bg-gradient-info ms-2">{{ projectTeams.length }}プロジェクト</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング状態 -->
            <div v-if="isProjectTeamsLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <p class="text-sm text-secondary mt-2">プロジェクトチームデータを読み込み中...</p>
            </div>
            
            <!-- エラー表示 -->
            <div v-else-if="projectTeamsErrorMessage" class="alert alert-danger mx-3" role="alert">
              {{ projectTeamsErrorMessage }}
            </div>
            
            <!-- プロジェクトチーム一覧 -->
            <div v-else class="row p-3">
              <div 
                v-for="project in projectTeams" 
                :key="project.project_id"
                class="col-lg-4 col-md-6 mb-4"
              >
                <div class="card h-100">
                  <div class="card-header pb-0">
                    <h6 class="mb-0">{{ project.project_name }}</h6>
                    <p class="text-sm text-secondary mb-0">プロジェクトID: {{ project.project_id }}</p>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-6">
                        <p class="text-sm mb-0">総メンバー数</p>
                        <h5 class="mb-0">{{ project.total_members }}</h5>
                      </div>
                      <div class="col-6">
                        <p class="text-sm mb-0">アクティブ</p>
                        <h5 class="mb-0 text-success">{{ project.active_members }}</h5>
                      </div>
                    </div>
                    <hr class="dark horizontal my-2">
                    <div class="d-flex flex-wrap">
                      <span 
                        v-for="member in project.members.slice(0, 3)" 
                        :key="member.user_id"
                        class="badge bg-gradient-primary me-1 mb-1"
                      >
                        {{ member.user?.display_name || '未設定' }}
                      </span>
                      <span 
                        v-if="project.members.length > 3"
                        class="badge bg-gradient-secondary me-1 mb-1"
                      >
                        +{{ project.members.length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ユーザー活動統計 -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>ユーザー活動統計</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-chart-line text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">ユーザー</span>の活動状況
                  <span class="badge bg-gradient-info ms-2">{{ userActivities.length }}名</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング状態 -->
            <div v-if="isUserActivitiesLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <p class="text-sm text-secondary mt-2">ユーザー活動データを読み込み中...</p>
            </div>
            
            <!-- ユーザー活動統計テーブル -->
            <div v-else class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ユーザー</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">総タスク</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">完了</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進行中</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">完了率</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">最終活動</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="activity in userActivities" :key="activity.user_id">
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ activity.display_name }}</h6>
                        </div>
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-xs font-weight-bold">{{ activity.total_tasks }}</span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-xs font-weight-bold text-success">{{ activity.completed_tasks }}</span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-xs font-weight-bold text-warning">{{ activity.in_progress_tasks }}</span>
                    </td>
                    <td class="align-middle text-center">
                      <div class="d-flex flex-column align-items-center">
                        <span class="text-xs font-weight-bold mb-1">{{ activity.completion_rate }}%</span>
                        <div class="progress w-100" style="max-width:80px;">
                          <div 
                            class="progress-bar bg-gradient-success" 
                            :style="{ width: activity.completion_rate + '%' }"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ getRelativeTime(activity.last_activity) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>通知一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-bell text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">システム通知</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredNotifications.length }}件</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング状態 -->
            <div v-if="isNotificationsLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <p class="text-sm text-secondary mt-2">通知データを読み込み中...</p>
            </div>
            
            <!-- エラー表示 -->
            <div v-else-if="notificationsErrorMessage" class="alert alert-danger mx-3" role="alert">
              {{ notificationsErrorMessage }}
            </div>
            
            <!-- 通知一覧テーブル -->
            <div v-else class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input"
                        @change="handleSelectAllNotifications(($event.target as HTMLInputElement).checked)"
                        :checked="selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0"
                        :indeterminate="selectedNotifications.size > 0 && selectedNotifications.size < filteredNotifications.length"
                      >
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">件名</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">送信先</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ステータス</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">作成日時</th>
                    <th class="text-secondary opacity-7"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="notification in filteredNotifications" :key="notification.id">
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input"
                        :checked="selectedNotifications.has(notification.id)"
                        @change="handleSelectNotification(notification.id, ($event.target as HTMLInputElement).checked)"
                      >
                    </td>
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ notification.subject }}</h6>
                          <p class="text-xs text-secondary mb-0">{{ notification.body_text.substring(0, 50) }}...</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">{{ notification.to_email }}</p>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="`badge ${NOTIFICATION_STATUS_COLORS[notification.status]}`">
                        {{ NOTIFICATION_STATUS_LABELS[notification.status] }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ new Date(notification.created_at).toLocaleString('ja-JP') }}
                      </span>
                    </td>
                    <td class="align-middle">
                      <div class="btn-group" role="group">
                        <button 
                          v-if="notification.status === 'FAILED'"
                          class="btn btn-sm bg-gradient-warning mb-0" 
                          @click="handleResendNotification(notification.id)"
                        >
                          再送信
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-danger mb-0" 
                          @click="handleDeleteNotification(notification.id)"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- アラートルール一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>アラートルール一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-cog text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">自動通知ルール</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredAlertRules.length }}件</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング状態 -->
            <div v-if="isAlertRulesLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <p class="text-sm text-secondary mt-2">アラートルールデータを読み込み中...</p>
            </div>
            
            <!-- エラー表示 -->
            <div v-else-if="alertRulesErrorMessage" class="alert alert-danger mx-3" role="alert">
              {{ alertRulesErrorMessage }}
            </div>
            
            <!-- アラートルール一覧テーブル -->
            <div v-else class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input"
                        @change="handleSelectAllAlertRules(($event.target as HTMLInputElement).checked)"
                        :checked="selectedAlertRules.size === filteredAlertRules.length && filteredAlertRules.length > 0"
                        :indeterminate="selectedAlertRules.size > 0 && selectedAlertRules.size < filteredAlertRules.length"
                      >
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ルール名</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">タイプ</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ステータス</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">通知先</th>
                    <th class="text-secondary opacity-7"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rule in filteredAlertRules" :key="rule.id">
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input"
                        :checked="selectedAlertRules.has(rule.id)"
                        @change="handleSelectAlertRule(rule.id, ($event.target as HTMLInputElement).checked)"
                      >
                    </td>
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ rule.name }}</h6>
                          <p class="text-xs text-secondary mb-0">プロジェクトID: {{ rule.project_id }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span :class="`badge ${ALERT_RULE_TYPE_COLORS[rule.rule_type]}`">
                        {{ ALERT_RULE_TYPE_LABELS[rule.rule_type] }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="rule.is_enabled ? 'badge bg-gradient-success' : 'badge bg-gradient-secondary'">
                        {{ rule.is_enabled ? '有効' : '無効' }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-xs font-weight-bold mb-0">{{ rule.notify_email || '未設定' }}</span>
                    </td>
                    <td class="align-middle">
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-sm bg-gradient-primary mb-0" 
                          @click="handleEditAlertRule(rule)"
                        >
                          編集
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-danger mb-0" 
                          @click="handleDeleteAlertRule(rule.id)"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ユーザー編集モーダル -->
    <ModalShell
      :show="showUserModal"
      :title="editingUser ? 'ユーザー編集' : 'ユーザー追加'"
      @close="closeUserModal"
      :actions="[
        {
          label: 'キャンセル',
          variant: 'secondary',
          onClick: closeUserModal
        },
        {
          label: editingUser ? '更新' : '作成',
          variant: 'primary',
          onClick: editingUser ? handleUpdateUser : handleCreateUser
        }
      ]"
    >
      <form>
        <div class="mb-3">
          <label class="form-label">メールアドレス</label>
          <input 
            type="email" 
            class="form-control" 
            v-model="userForm.email"
            required
          >
        </div>
        <div class="mb-3">
          <label class="form-label">表示名</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="userForm.display_name"
            required
          >
        </div>
        <div v-if="!editingUser" class="mb-3">
          <label class="form-label">パスワード</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="userForm.password_hash"
            required
          >
        </div>
        <div class="mb-3">
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="checkbox" 
              v-model="userForm.is_active"
              id="isActive"
            >
            <label class="form-check-label" for="isActive">
              アクティブ
            </label>
          </div>
        </div>
      </form>
    </ModalShell>

    <!-- チームメンバー追加モーダル -->
    <ModalShell
      :show="showMemberModal"
      title="チームメンバー追加"
      @close="closeMemberModal"
      :actions="[
        {
          label: 'キャンセル',
          variant: 'secondary',
          onClick: closeMemberModal
        },
        {
          label: '追加',
          variant: 'primary',
          onClick: handleAddTeamMember
        }
      ]"
    >
      <form>
        <div class="mb-3">
          <label class="form-label">ユーザーID</label>
          <input 
            type="number" 
            class="form-control" 
            v-model="memberForm.user_id"
            required
          >
        </div>
        <div class="mb-3">
          <label class="form-label">タスクID</label>
          <input 
            type="number" 
            class="form-control" 
            v-model="memberForm.task_id"
            required
          >
        </div>
        <div class="mb-3">
          <label class="form-label">役割</label>
          <select class="form-control" v-model="memberForm.role">
            <option value="OWNER">オーナー</option>
            <option value="CONTRIBUTOR">貢献者</option>
            <option value="REVIEWER">レビューアー</option>
          </select>
        </div>
      </form>
    </ModalShell>

    <!-- 通知作成・編集モーダル -->
    <div v-if="showNotificationModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingNotification ? '通知編集' : '通知作成' }}
            </h5>
            <button type="button" class="btn-close" @click="closeNotificationModal"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">プロジェクトID</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model="notificationForm.project_id"
                    required
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">タスクID（任意）</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model="notificationForm.task_id"
                  >
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">送信先メールアドレス</label>
                <input 
                  type="email" 
                  class="form-control" 
                  v-model="notificationForm.to_email"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">件名</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="notificationForm.subject"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">本文</label>
                <textarea 
                  class="form-control" 
                  rows="5"
                  v-model="notificationForm.body_text"
                  required
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">送信予定日時</label>
                <input 
                  type="datetime-local" 
                  class="form-control" 
                  v-model="notificationForm.send_after"
                  required
                >
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeNotificationModal">キャンセル</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="handleCreateNotification"
            >
              作成
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- アラートルール作成・編集モーダル -->
    <div v-if="showAlertRuleModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingAlertRule ? 'アラートルール編集' : 'アラートルール作成' }}
            </h5>
            <button type="button" class="btn-close" @click="closeAlertRuleModal"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label class="form-label">プロジェクトID</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="alertRuleForm.project_id"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">ルール名</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="alertRuleForm.name"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">ルールタイプ</label>
                <select class="form-control" v-model="alertRuleForm.rule_type">
                  <option value="DUE_SOON">期限間近</option>
                  <option value="OVERDUE">期限超過</option>
                  <option value="NO_PROGRESS">進捗なし</option>
                  <option value="CUSTOM">カスタム</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">通知先メールアドレス</label>
                <input 
                  type="email" 
                  class="form-control" 
                  v-model="alertRuleForm.notify_email"
                >
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="alertRuleForm.is_enabled"
                    id="isEnabled"
                  >
                  <label class="form-check-label" for="isEnabled">
                    有効
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAlertRuleModal">キャンセル</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="editingAlertRule ? handleUpdateAlertRule() : handleCreateAlertRule()"
            >
              {{ editingAlertRule ? '更新' : '作成' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ユーザープロフィールモーダル -->
    <div v-if="showUserProfileModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ selectedUserProfile?.display_name }} のプロフィール
            </h5>
            <button type="button" class="btn-close" @click="closeUserProfileModal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- 左側: プロフィール情報 -->
              <div class="col-md-4">
                <div class="card">
                  <div class="card-header text-center">
                    <div class="avatar-container mb-3">
                      <img 
                        v-if="userProfileForm.avatar_url" 
                        :src="userProfileForm.avatar_url" 
                        class="avatar-img rounded-circle"
                        style="width: 100px; height: 100px; object-fit: cover;"
                        alt="アバター"
                      >
                      <div 
                        v-else 
                        class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                        style="width: 100px; height: 100px; background: #e9ecef; margin: 0 auto;"
                      >
                        <i class="material-symbols-rounded" style="font-size: 48px; color: #6c757d;">person</i>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      @change="handleAvatarUpload"
                      class="form-control form-control-sm"
                      style="display: none;"
                      id="avatarUpload"
                    >
                    <label for="avatarUpload" class="btn btn-sm btn-outline-primary">
                      アバター変更
                    </label>
                  </div>
                  <div class="card-body">
                    <form>
                      <div class="mb-3">
                        <label class="form-label">姓</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model="userProfileForm.last_name"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">名</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model="userProfileForm.first_name"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">電話番号</label>
                        <input 
                          type="tel" 
                          class="form-control" 
                          v-model="userProfileForm.phone"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">部署</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model="userProfileForm.department"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">役職</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model="userProfileForm.position"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">自己紹介</label>
                        <textarea 
                          class="form-control" 
                          rows="3"
                          v-model="userProfileForm.bio"
                        ></textarea>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <!-- 右側: 統計情報と活動履歴 -->
              <div class="col-md-8">
                <!-- 統計情報 -->
                <div class="card mb-4">
                  <div class="card-header">
                    <h6 class="mb-0">パフォーマンス統計</h6>
                  </div>
                  <div class="card-body">
                    <div v-if="isProfileStatsLoading" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">読み込み中...</span>
                      </div>
                    </div>
                    <div v-else-if="userProfileStats" class="row">
                      <div class="col-md-3 col-6 mb-3">
                        <div class="text-center">
                          <h4 class="mb-0 text-primary">{{ userProfileStats.total_tasks }}</h4>
                          <p class="text-sm mb-0">総タスク数</p>
                        </div>
                      </div>
                      <div class="col-md-3 col-6 mb-3">
                        <div class="text-center">
                          <h4 class="mb-0 text-success">{{ userProfileStats.completed_tasks }}</h4>
                          <p class="text-sm mb-0">完了タスク</p>
                        </div>
                      </div>
                      <div class="col-md-3 col-6 mb-3">
                        <div class="text-center">
                          <h4 class="mb-0 text-warning">{{ userProfileStats.in_progress_tasks }}</h4>
                          <p class="text-sm mb-0">進行中</p>
                        </div>
                      </div>
                      <div class="col-md-3 col-6 mb-3">
                        <div class="text-center">
                          <h4 class="mb-0 text-danger">{{ userProfileStats.overdue_tasks }}</h4>
                          <p class="text-sm mb-0">遅延タスク</p>
                        </div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <div class="text-center">
                          <h4 class="mb-0 text-info">{{ userProfileStats.completion_rate }}%</h4>
                          <p class="text-sm mb-0">完了率</p>
                        </div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <div class="text-center">
                          <h4 class="mb-0 text-primary">{{ userProfileStats.productivity_score }}</h4>
                          <p class="text-sm mb-0">生産性スコア</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 活動履歴 -->
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">最近の活動</h6>
                  </div>
                  <div class="card-body">
                    <div v-if="isActivityLogsLoading" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">読み込み中...</span>
                      </div>
                    </div>
                    <div v-else-if="userActivityLogs.length > 0" class="activity-list">
                      <div 
                        v-for="log in userActivityLogs.slice(0, 10)" 
                        :key="log.id"
                        class="activity-item d-flex align-items-center mb-3"
                      >
                        <div class="activity-icon me-3">
                          <i class="material-symbols-rounded text-primary">task_alt</i>
                        </div>
                        <div class="activity-content flex-grow-1">
                          <p class="mb-1 text-sm">{{ log.description }}</p>
                          <small class="text-muted">{{ getRelativeTime(log.created_at) }}</small>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center py-4 text-muted">
                      活動履歴がありません
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeUserProfileModal">閉じる</button>
            <button type="button" class="btn btn-primary" @click="handleUpdateUserProfile">更新</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* チーム管理ページのスタイリング */
.team-management {
  min-height: 100vh;
}

/* カードホバーエフェクト */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* ボタンホバーエフェクト */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* テーブルスタイリング */
.table th {
  border-top: none;
  font-weight: 600;
}

.table td {
  vertical-align: middle;
}

/* バッジスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

/* プログレスバースタイリング */
.progress {
  height: 0.5rem;
  border-radius: 0.25rem;
}

/* モーダルスタイリング */
.modal {
  z-index: 1050;
}

.modal-dialog {
  margin-top: 5rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .container-fluid {
    padding-left: 15px;
    padding-right: 15px;
  }
  
  .btn-group .btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}

/* アニメーション */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.3s ease-out;
}
</style>
