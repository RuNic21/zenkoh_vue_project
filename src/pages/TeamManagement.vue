<script setup lang="ts">

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


// チーム管理ページコンポーネント
// 目的: ユーザー管理、チームメンバー管理、権限管理を提供

import { ref, computed, onMounted } from "vue";
// TODO: プロジェクトメンバー管理機能が実装されたら有効化
// import { useTeamMembersManagement } from "@/composables/useTeamMembersManagement";
// TODO: プロジェクト別チーム情報機能（project_members テーブル作成後に有効化）
// import { useProjectTeamsManagement } from "@/composables/useProjectTeamsManagement";
import AlertRuleTable from "@/components/notification/AlertRuleTable.vue";
import NotificationModal from "@/components/notification/NotificationModal.vue";
import AlertRuleModal from "@/components/notification/AlertRuleModal.vue";
import { useNotificationsManagement } from "@/composables/useNotificationsManagement";
import { useMessage, useConfirm } from "@/composables/useMessage";
import OptimizedDataTable from "@/components/table/OptimizedDataTable.vue";
import { useTeamManagement } from "@/composables/useTeamManagement";
// チーム管理・権限/統計関連の型をインポート
import type { 
  User,                // ユーザー情報
  TeamMemberWithUser,  // メンバー+ユーザ詳細
  ProjectTeam,         // プロジェクト単位チーム
  TeamStats,           // チームの統計情報
  UserActivity,        // ユーザー個別の活動記録
  TeamRole,            // チーム役割タイプ
  UserProfileUpdate,   // ユーザープロフィール更新用
  UserProfileStats,    // ユーザーの統計データ
  UserActivityLog      // 活動履歴ログ
} from "../types/team";

// 共通コンポーネントのインポート
import PageHeader from "../components/common/PageHeader.vue";
import ActionBar from "../components/common/ActionBar.vue";
import StatCards from "../components/common/StatCards.vue";
import TeamStatsCards from "../components/team/TeamStatsCards.vue";
import TeamFilterPanel from "../components/team/TeamFilterPanel.vue";
import UserProfileModal from "../components/user/UserProfileModal.vue";
// BulkActionsPanel は UserManagementTable に統合されました
import UserManagementTable from "../components/user/UserManagementTable.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityBadge from "../components/common/PriorityBadge.vue";
import ModalShell from "../components/common/ModalShell.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import EmptyState from "../components/common/EmptyState.vue";
import CardHeader from "../components/common/CardHeader.vue";
// 通知・アラートルール関連型のインポート
import type {
  Notification,           // 通知データ型
  AlertRule,              // アラートルール型
  NotificationStats,      // 通知統計データ型
  NotificationFilter,     // 通知フィルタ―条件型
  NotificationStatus,     // 通知の状態（例: SENT, FAILEDなど）
  AlertRuleType           // アラートルールの種類
} from "../types/notification";

// チーム関連サービス関数のインポート
import { 
  listUsers,                     // ユーザー一覧取得
  listActiveUsers,               // 有効ユーザーのみ取得
  createUser,                    // ユーザー新規作成
  updateUser,                    // ユーザー情報更新
  listTeamMembersWithUsers,      // チームメンバー+ユーザー詳細取得
  addTeamMember,                 // チームメンバー追加
  updateTeamMemberRole,          // メンバーの役割変更
  removeTeamMember,              // チームメンバー削除
  getProjectTeams,               // プロジェクト別チーム取得
  getTeamStats,                  // チーム統計情報取得
  getUserActivityStats,          // ユーザー活動統計取得
  updateUserProfile,             // ユーザープロフィール更新
  getUserProfileStats,           // ユーザープロフィール統計
  getUserActivityLogs,           // ユーザー活動ログ取得
  uploadUserAvatar,              // プロフィール画像アップロード
  searchUsers                    // ユーザー検索
} from "../services/teamService";

// 通知管理サービス関数のインポート
import {
  listNotifications,                 // 通知一覧取得
  createNotification,                // 通知新規作成
  updateNotification,                // 通知更新
  deleteNotification,                // 通知削除
  resendNotification,                // 通知再送信
  listAlertRules,                    // アラートルール一覧取得
  createAlertRule,                   // アラートルール新規作成
  updateAlertRule,                   // アラートルール更新
  deleteAlertRule,                   // アラートルール削除
  getNotificationStats,              // 通知統計取得
  createNotificationFromTemplate,    // テンプレートから通知作成
  NOTIFICATION_TEMPLATES             // 利用可能な通知テンプレート
} from "../services/notificationService";

// チーム役割ラベル・色の定数インポート
import { TEAM_ROLE_LABELS, TEAM_ROLE_COLORS } from "../types/team";

// 通知状態・アラートルール種類のラベル/色定数インポート
import { 
  NOTIFICATION_STATUS_LABELS,    // 通知ステータス日本語ラベル
  NOTIFICATION_STATUS_COLORS,    // 通知ステータス表示色
  ALERT_RULE_TYPE_LABELS,        // アラートルール種類ラベル
  ALERT_RULE_TYPE_COLORS         // アラートルール種類表示色
} from "../types/notification";

// composable から主要状態を取得（重複を避けるため users/stats/notifications のみ）
const {
  users,                  // ユーザー一覧
  isUsersLoading,         // ユーザー一覧取得中フラグ
  usersErrorMessage,      // ユーザー取得時のエラーメッセージ
  teamStats,              // チーム統計データ
  isStatsLoading,         // チーム統計読み込み中フラグ
  notifications,          // 通知一覧データ
  notificationStats,      // 通知の統計値
  alertRules,             // アラートルール一覧
  isNotificationsLoading, // 通知読み込み中フラグ
  isAlertRulesLoading,    // アラートルール読み込み中フラグ
  loadUsers,              // ユーザー一覧の再取得関数
  loadTeamStats,          // チーム統計の再取得関数
  loadNotificationsSummary// 通知サマリーの再取得関数
} = useTeamManagement();

// メッセージシステム
const { showSuccess, showError } = useMessage();
const { confirm: confirmDialog } = useConfirm();

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に実装）
// const {
//   members: teamMemberRows,
//   isLoading: isTeamMembersLoading,
//   errorMessage: teamMembersErrorMessage,
//   addMember: addTeamMemberAction,
//   changeRole: changeTeamMemberRoleAction,
//   removeMember: removeTeamMemberAction,
//   loadMembers,
// } = useTeamMembersManagement();

// 以下のセクション（teamMembers, projectTeams, ...）は既存のローカル状態を維持

// チームメンバー管理（composable 提供を利用）

// TODO: プロジェクト別チーム情報機能（project_members テーブル作成後に有効化）
// const {
//   projectTeams,
//   isProjectTeamsLoading,
//   projectTeamsErrorMessage,
//   loadProjectTeams: tmLoadProjectTeams,
// } = useProjectTeamsManagement();

// ユーザー活動統計
const userActivities = ref<UserActivity[]>([]);
const isUserActivitiesLoading = ref(false);

// 通知管理
const notificationsErrorMessage = ref("");

// アラートルール管理
const alertRulesErrorMessage = ref("");

// 通知統計情報
const isNotificationStatsLoading = ref(false);

// フィルタリング・検索（セクション別に分離）
// ユーザー管理用フィルター
const userSearchQuery = ref("");
const userStatusFilter = ref("all"); // 'all' | 'active' | 'inactive'

// チームメンバー用フィルター
const memberSearchQuery = ref("");
const memberRoleFilter = ref("all"); // 'all' | 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'

// 通知管理用フィルター
const notificationSearchQuery = ref("");
const notificationStatusFilter = ref("all"); // 'all' | 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED'

// アラートルール用フィルター
const alertRuleSearchQuery = ref("");

// ユーザー活動用フィルター
const activitySearchQuery = ref("");

// 後方互換性のために維持（TeamFilterPanelで使用）
const searchQuery = ref("");
const statusFilter = ref("all");
const roleFilter = ref("all");

// 一括操作関連
const selectedUsers = ref<Set<number>>(new Set());
const selectedTeamMembers = ref<Set<string>>(new Set());
const selectedNotifications = ref<Set<number>>(new Set());
const selectedAlertRules = ref<Set<number>>(new Set());
const showBulkActions = ref(false);
const bulkActionType = ref<"users" | "teamMembers" | "notifications" | "alertRules">("users");

// モーダル状態
const showUserProfileModal = ref(false);
const userModalMode = ref<"create" | "edit" | "view">("view");
const selectedUserProfile = ref<User | null>(null);
// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const showMemberModal = ref(false);
const showNotificationModal = ref(false);
const showAlertRuleModal = ref(false);
// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const editingMember = ref<TeamMemberWithUser | null>(null);
const editingNotification = ref<Notification | null>(null);
const editingAlertRule = ref<AlertRule | null>(null);

// ユーザープロフィール関連
const userProfileStats = ref<UserProfileStats | null>(null);
const userActivityLogs = ref<UserActivityLog[]>([]);
const isProfileStatsLoading = ref(false);
const isActivityLogsLoading = ref(false);

// 統合ユーザーフォーム（基本情報 + プロフィール情報）
const userForm = ref({
  // 基本情報
  email: "",
  display_name: "",
  password_hash: "",
  is_active: true,
  // プロフィール情報
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

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const memberForm = ref({
//   user_id: 0,
//   task_id: 0,
//   role: "CONTRIBUTOR" as TeamRole
// });

const notificationForm = ref({
  project_id: 0,
  task_id: 0,
  to_email: "",
  subject: "",
  body_text: "",
  send_after: new Date().toISOString()
});

const alertRuleForm = ref<{
  project_id: number | null;
  name: string;
  rule_type: AlertRuleType;
  params_json: Record<string, any>;
  is_enabled: boolean;
  notify_email: string;
}>({
  project_id: null,
  name: "",
  rule_type: "DUE_SOON",
  params_json: {},
  is_enabled: true,
  notify_email: ""
});

// ===== 計算プロパティ =====

// フィルタリングされたユーザー一覧（ユーザー管理専用フィルター）
const filteredUsers = computed(() => {
  let filtered = users.value;

  // ユーザー検索クエリでフィルタリング
  if (userSearchQuery.value.trim()) {
    const query = userSearchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.display_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.first_name && user.first_name.toLowerCase().includes(query)) ||
      (user.last_name && user.last_name.toLowerCase().includes(query)) ||
      (user.department && user.department.toLowerCase().includes(query)) ||
      (user.position && user.position.toLowerCase().includes(query))
    );
  }

  // ユーザーステータスでフィルタリング
  if (userStatusFilter.value !== "all") {
    filtered = filtered.filter(user => {
      switch (userStatusFilter.value) {
        case "active":
          return user.is_active;
        case "inactive":
          return !user.is_active;
        default:
          return true;
      }
    });
  }

  return filtered;
});

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に実装）
// const filteredTeamMembers = computed(() => {
//   let filtered = (teamMemberRows.value as any[]);
//
//   if (searchQuery.value.trim()) {
//     const query = searchQuery.value.toLowerCase();
//     filtered = filtered.filter((member) =>
//       (member.user?.display_name || '').toLowerCase().includes(query)
//     );
//   }
//
//   if (roleFilter.value !== "all") {
//     filtered = filtered.filter((member) => member.role === roleFilter.value);
//   }
//
//   return filtered;
// });

// フィルタリングされた通知一覧（通知管理専用フィルター）
const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  // 通知検索クエリでフィルタリング
  if (notificationSearchQuery.value.trim()) {
    const query = notificationSearchQuery.value.toLowerCase();
    filtered = filtered.filter(notification => 
      notification.subject.toLowerCase().includes(query) ||
      notification.to_email.toLowerCase().includes(query) ||
      notification.body_text.toLowerCase().includes(query)
    );
  }

  // 通知ステータスでフィルタリング
  if (notificationStatusFilter.value !== "all") {
    filtered = filtered.filter(notification => notification.status === notificationStatusFilter.value);
  }

  return filtered;
});

// 通知テーブルのカラム定義
const notificationColumns = computed(() => [
  {
    key: "subject",
    label: "件名",
    sortable: true,
    filterable: false,
    width: "30%"
  },
  {
    key: "to_email",
    label: "送信先",
    sortable: true,
    filterable: false,
    width: "20%"
  },
  {
    key: "status",
    label: "ステータス",
    sortable: true,
    filterable: true,
    width: "15%",
    formatter: (value: string) => NOTIFICATION_STATUS_LABELS[value as keyof typeof NOTIFICATION_STATUS_LABELS] || value
  },
  {
    key: "created_at",
    label: "作成日時",
    sortable: true,
    filterable: false,
    width: "20%",
    formatter: (value: string) => new Date(value).toLocaleString("ja-JP")
  },
  {
    key: "actions",
    label: "操作",
    sortable: false,
    filterable: false,
    width: "15%"
  }
]);

// フィルタリングされたアラートルール一覧（アラートルール専用フィルター）
const filteredAlertRules = computed(() => {
  let filtered = alertRules.value;

  // アラートルール検索クエリでフィルタリング
  if (alertRuleSearchQuery.value.trim()) {
    const query = alertRuleSearchQuery.value.toLowerCase();
    filtered = filtered.filter(rule => 
      rule.name.toLowerCase().includes(query) ||
      rule.rule_type.toLowerCase().includes(query) ||
      (rule.notify_email && rule.notify_email.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// フィルタリングされたユーザー活動統計（活動統計専用フィルター）
const filteredUserActivities = computed(() => {
  let filtered = userActivities.value;

  // 活動統計検索クエリでフィルタリング（ユーザー名で検索）
  if (activitySearchQuery.value.trim()) {
    const query = activitySearchQuery.value.toLowerCase();
    filtered = filtered.filter(activity => 
      activity.display_name.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// ===== メソッド =====

// データ読み込みは composable の loadMembers に委譲

// TODO: プロジェクト別チーム情報機能（project_members テーブル作成後に有効化）
// const loadProjectTeams = async () => {
//   try {
//     isProjectTeamsLoading.value = true;
//     projectTeamsErrorMessage.value = "";
//     const result = await getProjectTeams();
//     if (result.success && result.data) {
//       projectTeams.value = result.data;
//     } else {
//       projectTeamsErrorMessage.value = result.error || "プロジェクトチームの読み込みに失敗しました";
//       projectTeams.value = [];
//     }
//   } catch (error) {
//     console.error("プロジェクトチーム読み込みエラー:", error);
//     projectTeamsErrorMessage.value = "プロジェクトチームの読み込みに失敗しました";
//     projectTeams.value = [];
//   } finally {
//     isProjectTeamsLoading.value = false;
//   }
// };

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

// ユーザー管理（統合モーダル版）
const handleSaveUser = async () => {
  try {
    if (userModalMode.value === "create") {
      // 新規作成
      const newUser = await createUser(userForm.value);
      if (newUser) {
        await loadUsers();
        await loadTeamStats();
        closeUserProfileModal();
        alert("ユーザーが正常に作成されました");
      } else {
        alert("ユーザーの作成に失敗しました");
      }
    } else if (userModalMode.value === "edit" && selectedUserProfile.value) {
      // 更新
      const updatedUser = await updateUser(selectedUserProfile.value.id, {
        email: userForm.value.email,
        display_name: userForm.value.display_name,
        is_active: userForm.value.is_active
      });
      
      if (updatedUser) {
        // プロフィール情報も更新（将来実装予定）
        // await updateUserProfile(selectedUserProfile.value.id, userForm.value);
        await loadUsers();
        await loadTeamStats();
        closeUserProfileModal();
        alert("ユーザーが正常に更新されました");
      } else {
        alert("ユーザーの更新に失敗しました");
      }
    }
  } catch (error) {
    console.error("ユーザー保存エラー:", error);
    alert("ユーザー保存中にエラーが発生しました");
  }
};

const handleEditUser = (user: User) => {
  selectedUserProfile.value = user;
  userModalMode.value = "edit";
  userForm.value = {
    // 基本情報
    email: user.email,
    display_name: user.display_name,
    password_hash: "",
    is_active: user.is_active || true,
    // プロフィール情報
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

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const handleAddTeamMember = async () => {
//   try {
//     const newMember = await addTeamMember(memberForm.value);
//     if (newMember) {
//       await loadMembers();
//       await tmLoadProjectTeams();
//       closeMemberModal();
//       alert("チームメンバーが正常に追加されました");
//     } else {
//       alert("チームメンバーの追加に失敗しました");
//     }
//   } catch (error) {
//     console.error("チームメンバー追加エラー:", error);
//     alert("チームメンバー追加中にエラーが発生しました");
//   }
// };

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const handleUpdateMemberRole = async (userId: number, taskId: number, newRole: TeamRole) => {
//   try {
//     const updatedMember = await updateTeamMemberRole(userId, taskId, { role: newRole });
//     if (updatedMember) {
//       await loadMembers();
//       await tmLoadProjectTeams();
//       alert("チームメンバーの役割が正常に更新されました");
//     } else {
//       alert("チームメンバーの役割更新に失敗しました");
//     }
//   } catch (error) {
//     console.error("チームメンバー役割更新エラー:", error);
//     alert("チームメンバー役割更新中にエラーが発生しました");
//   }
// };
//
// const handleRemoveTeamMember = async (userId: number, taskId: number) => {
//   if (!confirm("このチームメンバーを削除しますか？")) return;
//   
//   try {
//     const success = await removeTeamMember(userId, taskId);
//     if (success) {
//       await loadMembers();
//       await tmLoadProjectTeams();
//       alert("チームメンバーが正常に削除されました");
//     } else {
//       alert("チームメンバーの削除に失敗しました");
//     }
//   } catch (error) {
//     console.error("チームメンバー削除エラー:", error);
//     alert("チームメンバー削除中にエラーが発生しました");
//   }
// };

// 通知管理
const handleCreateNotification = async () => {
  try {
    const newNotification = await createNotification(notificationForm.value);
    if (newNotification) {
      await loadNotifications();
      await loadNotificationStats();
      closeNotificationModal();
      showSuccess("通知が正常に作成されました");
    } else {
      showError("通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("通知作成エラー:", error);
    showError("通知作成中にエラーが発生しました");
  }
};

const handleResendNotification = async (id: number) => {
  try {
    const success = await resendNotificationAction(id);
    if (success) {
      await loadNotifications();
      await loadNotificationStats();
      showSuccess("通知の再送信が完了しました");
    } else {
      showError("通知の再送信に失敗しました");
    }
  } catch (error) {
    console.error("通知再送信エラー:", error);
    showError("通知再送信中にエラーが発生しました");
  }
};

const handleDeleteNotification = async (id: number) => {
  const confirmed = await confirmDialog({
    message: "この通知を削除しますか？",
    type: "danger"
  });
  if (!confirmed) return;
  
  try {
    const success = await deleteNotificationAction(id);
    if (success) {
      await loadNotifications();
      await loadNotificationStats();
      showSuccess("通知が正常に削除されました");
    } else {
      showError("通知の削除に失敗しました");
    }
  } catch (error) {
    console.error("通知削除エラー:", error);
    showError("通知削除中にエラーが発生しました");
  }
};

// アラートルール管理
const handleCreateAlertRule = async () => {
  try {
    const newAlertRule = await createAlertRule(alertRuleForm.value);
    if (newAlertRule) {
      await loadAlertRules();
      closeAlertRuleModal();
      showSuccess("アラートルールが正常に作成されました");
    } else {
      showError("アラートルールの作成に失敗しました");
    }
  } catch (error) {
    console.error("アラートルール作成エラー:", error);
    showError("アラートルール作成中にエラーが発生しました");
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
      showSuccess("アラートルールが正常に更新されました");
    } else {
      showError("アラートルールの更新に失敗しました");
    }
  } catch (error) {
    console.error("アラートルール更新エラー:", error);
    showError("アラートルール更新中にエラーが発生しました");
  }
};

const handleDeleteAlertRule = async (id: number) => {
  const confirmed = await confirmDialog({
    message: "このアラートルールを削除しますか？",
    type: "danger"
  });
  if (!confirmed) return;
  
  try {
    const success = await deleteAlertRuleAction(id);
    if (success) {
      await loadAlertRules();
      showSuccess("アラートルールが正常に削除されました");
    } else {
      showError("アラートルールの削除に失敗しました");
    }
  } catch (error) {
    console.error("アラートルール削除エラー:", error);
    showError("アラートルール削除中にエラーが発生しました");
  }
};

const openEditNotificationModalById = (id: number) => {
  const target = filteredNotifications.value.find(n => n.id === id);
  if (!target) return;
  openEditNotificationModal(target);
};

const openEditAlertRuleModalById = (id: number) => {
  const target = filteredAlertRules.value.find(r => r.id === id);
  if (!target) return;
  handleEditAlertRule(target);
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
  userModalMode.value = "view";
  userForm.value = {
    // 基本情報
    email: user.email,
    display_name: user.display_name,
    password_hash: "",
    is_active: user.is_active || true,
    // プロフィール情報
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
  
  // プロフィール統計と活動履歴を読み込み
  await Promise.all([
    loadUserProfileStats(user.id),
    loadUserActivityLogs(user.id)
  ]);
};

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !selectedUserProfile.value) return;
  
  try {
    const avatarUrl = await uploadUserAvatar(selectedUserProfile.value.id, file);
    if (avatarUrl) {
      userForm.value.avatar_url = avatarUrl;
      showSuccess("アバターが正常にアップロードされました");
    } else {
      showError("アバターのアップロードに失敗しました");
    }
  } catch (error) {
    console.error("アバターアップロードエラー:", error);
    showError("アバターアップロード中にエラーが発生しました");
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

// 通知ステータス表示のヘルパー関数
const getNotificationStatusColor = (status: string) => {
  return NOTIFICATION_STATUS_COLORS[status as keyof typeof NOTIFICATION_STATUS_COLORS] || "bg-gradient-secondary";
};

const getNotificationStatusLabel = (status: string) => {
  return NOTIFICATION_STATUS_LABELS[status as keyof typeof NOTIFICATION_STATUS_LABELS] || status;
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

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const handleSelectAllTeamMembers = (checked: boolean) => {
//   if (checked) {
//     filteredTeamMembers.value.forEach(member => 
//       selectedTeamMembers.value.add(`${member.user_id}-${member.task_id}`)
//     );
//   } else {
//     selectedTeamMembers.value.clear();
//   }
//   updateBulkActionsVisibility();
// };

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
      // 現在は機能無効化（DB削除は未実装）
      console.log(`ユーザー削除（仮実装）: ${userId}`);
      successCount++;
    }
    
    if (successCount > 0) {
      await loadUsers();
      await loadTeamStats();
      selectedUsers.value.clear();
      updateBulkActionsVisibility();
      showSuccess(`${successCount}名のユーザーが削除されました`);
    }
  } catch (error) {
    console.error("一括ユーザー削除エラー:", error);
    showError("一括削除中にエラーが発生しました");
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
      showSuccess(`${successCount}名のユーザーがアクティブになりました`);
    }
  } catch (error) {
    console.error("一括ユーザーアクティブ化エラー:", error);
    showError("一括アクティブ化中にエラーが発生しました");
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
      showSuccess(`${successCount}名のユーザーが非アクティブになりました`);
    }
  } catch (error) {
    console.error("一括ユーザー非アクティブ化エラー:", error);
    showError("一括非アクティブ化中にエラーが発生しました");
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
      showSuccess(`${successCount}件の通知が削除されました`);
    }
  } catch (error) {
    console.error("一括通知削除エラー:", error);
    showError("一括削除中にエラーが発生しました");
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
      showSuccess(`${successCount}件の通知が再送信されました`);
    }
  } catch (error) {
    console.error("一括通知再送信エラー:", error);
    showError("一括再送信中にエラーが発生しました");
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
      showSuccess(`${successCount}件のアラートルールが削除されました`);
    }
  } catch (error) {
    console.error("一括アラートルール削除エラー:", error);
    showError("一括削除中にエラーが発生しました");
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
  selectedUserProfile.value = null;
  userModalMode.value = "create";
  userForm.value = {
    // 基本情報
    email: "",
    display_name: "",
    password_hash: "",
    is_active: true,
    // プロフィール情報
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
    skills: [],
    tags: []
  };
  showUserProfileModal.value = true;
};

const closeUserProfileModal = () => {
  showUserProfileModal.value = false;
  selectedUserProfile.value = null;
  userProfileStats.value = null;
  userActivityLogs.value = [];
};

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
// const openMemberModal = () => {
//   editingMember.value = null;
//   memberForm.value = {
//     user_id: 0,
//     task_id: 0,
//     role: "CONTRIBUTOR"
//   };
//   showMemberModal.value = true;
// };
//
// const closeMemberModal = () => {
//   showMemberModal.value = false;
//   editingMember.value = null;
// };

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

const openEditNotificationModal = (n: Notification) => {
  editingNotification.value = n;
  notificationForm.value = {
    project_id: (n as any).project_id ?? 0,
    task_id: (n as any).task_id ?? 0,
    to_email: n.to_email,
    subject: n.subject,
    body_text: n.body_text,
    send_after: (n as any).send_after ?? new Date().toISOString(),
  };
  showNotificationModal.value = true;
};

const closeNotificationModal = () => {
  showNotificationModal.value = false;
  editingNotification.value = null;
};

// 通知モーダル保存処理（作成/更新の分岐）
const onSaveNotification = async (f: { subject: string; to_email: string; body_text: string }) => {
  try {
    // フォームデータを更新
    notificationForm.value.subject = f.subject;
    notificationForm.value.to_email = f.to_email;
    notificationForm.value.body_text = f.body_text;
    
    if (editingNotification.value) {
      // 編集モード：更新処理
      const updatePayload = {
        subject: f.subject,
        to_email: f.to_email,
        body_text: f.body_text,
      };
      
      const success = await updateNotificationAction(editingNotification.value.id, updatePayload);
      
      if (success) {
        // 成功時：データ再読み込みとモーダル閉じる
        await Promise.all([
          loadNotifications(),
          loadNotificationStats()
        ]);
        closeNotificationModal();
        showSuccess("通知が正常に更新されました");
      } else {
        showError("通知の更新に失敗しました。もう一度お試しください。");
      }
    } else {
      // 作成モード：新規作成処理
      await handleCreateNotification();
    }
  } catch (error) {
    console.error("通知保存エラー:", error);
    showError("通知の保存中にエラーが発生しました。もう一度お試しください。");
  }
};

const openAlertRuleModal = () => {
  editingAlertRule.value = null;
  alertRuleForm.value = {
    project_id: null,
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

// アラートルールモーダル保存処理（作成/更新の分岐）
const onSaveAlertRule = async (f: {
  project_id: number | null;
  name: string;
  rule_type: AlertRuleType;
  notify_email: string;
  is_enabled: boolean;
  params_json: Record<string, any>;
}) => {
  try {
    // project_id が null の場合はエラー
    if (!f.project_id) {
      showError("プロジェクトを選択してください");
      return;
    }

    if (editingAlertRule.value) {
      // 編集モード：更新処理
      const updatePayload = {
        project_id: f.project_id,
        name: f.name,
        rule_type: f.rule_type,
        is_enabled: f.is_enabled,
        notify_email: f.notify_email,
        params_json: f.params_json,
      };
      
      const success = await updateAlertRuleAction(editingAlertRule.value.id, updatePayload);
      
      if (success) {
        // 成功時：データ再読み込みとモーダル閉じる
        await loadAlertRules();
        closeAlertRuleModal();
        alert("アラートルールが正常に更新されました");
      } else {
        alert("アラートルールの更新に失敗しました。もう一度お試しください。");
      }
    } else {
      // 作成モード：新規作成処理
      const createPayload = {
        project_id: f.project_id,
        name: f.name,
        rule_type: f.rule_type,
        is_enabled: f.is_enabled,
        notify_email: f.notify_email,
        params_json: f.params_json,
      };
      
      const success = await createAlertRuleAction(createPayload);
      
      if (success) {
        await loadAlertRules();
        closeAlertRuleModal();
        alert("アラートルールが正常に作成されました");
      } else {
        alert("アラートルールの作成に失敗しました。もう一度お試しください。");
      }
    }
  } catch (error) {
    console.error("アラートルール保存エラー:", error);
    alert("アラートルールの保存中にエラーが発生しました。もう一度お試しください。");
  }
};


// フィルタリセット（セクション別）
const clearUserFilters = () => {
  userSearchQuery.value = "";
  userStatusFilter.value = "all";
};

const clearNotificationFilters = () => {
  notificationSearchQuery.value = "";
  notificationStatusFilter.value = "all";
};

const clearAlertRuleFilters = () => {
  alertRuleSearchQuery.value = "";
};

const clearActivityFilters = () => {
  activitySearchQuery.value = "";
};

// TeamFilterPanel用（後方互換性）
const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
  roleFilter.value = "all";
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
        openUserModal();
      }
    }
    // TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
    // {
    //   label: 'チームメンバー追加',
    //   icon: 'group_add',
    //   variant: 'outline-primary',
    //   onClick: () => {
    //     // チームメンバー追加モーダルを開く
    //     showMemberModal.value = true;
    //   }
    // }
  ];
};

// TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に実装）
// const teamMemberColumns = computed(() => [
//   {
//     key: "display_name",
//     label: "ユーザー",
//     sortable: true,
//     width: "40%"
//   },
//   {
//     key: "role",
//     label: "役割",
//     sortable: true,
//     filterable: true,
//     width: "30%"
//   },
//   {
//     key: "joined_at",
//     label: "参加日時",
//     sortable: true,
//     width: "20%",
//     formatter: (value: string) => {
//       if (!value) return "-";
//       return new Date(value).toLocaleDateString("ja-JP", {
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit"
//       });
//     }
//   },
//   {
//     key: "actions",
//     label: "操作",
//     sortable: false,
//     width: "10%"
//   }
// ]);



// 初期化
onMounted(async () => {
  console.log("チーム管理ページが初期化されました");
  await Promise.all([
    loadUsers(),
    // TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
    // loadMembers(),
    // TODO: プロジェクト別チーム情報機能（project_members テーブル作成後に有効化）
    // tmLoadProjectTeams(),
    loadTeamStats(),
    loadUserActivities(),
    loadNotifications(),
    loadAlertRules(),
    loadNotificationStats()
  ]);
});

const {
  createNotificationAction,
  updateNotificationAction,
  deleteNotificationAction,
  resendNotificationAction,
  createAlertRuleAction,
  updateAlertRuleAction,
  deleteAlertRuleAction,
} = useNotificationsManagement();
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
    <TeamStatsCards 
      :team-stats="teamStats"
      :notification-stats="notificationStats"
      :alert-rules="alertRules"
    />

    <!-- フィルタリング・アクションパネル（ユーザー管理専用） -->
    <TeamFilterPanel
      v-model:search-query="userSearchQuery"
      v-model:status-filter="userStatusFilter"
      v-model:role-filter="roleFilter"
      @clear-filters="clearUserFilters"
    />

    <!-- ユーザー一覧 -->
    <UserManagementTable
      :users="users"
      :filtered-users="filteredUsers"
      :selected-users="selectedUsers"
      :is-loading="isUsersLoading"
      :error-message="usersErrorMessage"
      @select-user="handleSelectUser"
      @select-all-users="handleSelectAllUsers"
      @view-profile="handleViewUserProfile"
      @edit-user="handleEditUser"
      @create-user="openUserModal"
      @bulk-activate-users="handleBulkActivateUsers"
      @bulk-deactivate-users="handleBulkDeactivateUsers"
      @bulk-delete-users="handleBulkDeleteUsers"
      @clear-selections="clearAllSelections"
    />

    <!-- 一括操作パネル: UserManagementTable コンポーネントに統合されました -->

    <!-- TODO: プロジェクトメンバー管理機能
         現在のスキーマでは実装不可
         理由: task_members テーブルはタスク単位のメンバー管理のみサポート
         必要な対応:
         1. project_members テーブルを新規作成
            CREATE TABLE project_members (
              project_id BIGINT NOT NULL REFERENCES projects(id),
              user_id BIGINT NOT NULL REFERENCES users(id),
              role TEXT NOT NULL,  -- 'OWNER', 'CONTRIBUTOR', 'REVIEWER'
              joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              PRIMARY KEY (project_id, user_id)
            );
         2. projectService に project_members 関連サービス追加
         3. composable (useTeamMembersManagement) 実装
         4. UI コンポーネント実装
    -->

    <!-- TODO: プロジェクト別チーム情報
         現在の実装は task_members テーブルからの集計のため制限あり
         問題点:
         - タスクがないプロジェクトはメンバー0として表示
         - タスクに割り当てられていないプロジェクトメンバーは表示されない
         - プロジェクトレベルの権限管理は不可能
         
         正しい実装のために必要:
         1. project_members テーブル作成
         2. projectService に project_members 専用サービス追加
         3. composable (useProjectTeamsManagement) を project_members ベースに再実装
         4. UI コンポーネントを正しいデータソースで再実装
    -->

    <!-- ユーザー活動統計 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-3">
            <div class="row mb-3">
              <div class="col-lg-6 col-8">
                <h6>ユーザー活動統計</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-chart-line text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">ユーザー</span>の活動状況
                  <span class="badge bg-gradient-info ms-2">{{ filteredUserActivities.length }}名</span>
                </p>
              </div>
            </div>
            <!-- 検索バー（活動統計専用） -->
            <div class="row">
              <div class="col-md-6 mb-2">
                <div class="input-group input-group-outline">
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="ユーザー名で検索..."
                    v-model="activitySearchQuery"
                  >
                </div>
              </div>
              <div class="col-md-3 mb-2">
                <button 
                  class="btn btn-sm btn-outline-secondary w-100"
                  @click="clearActivityFilters"
                >
                  <i class="fa fa-times me-1"></i>
                  フィルタクリア
                </button>
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
                  <!-- データがある場合 -->
                  <tr v-for="activity in filteredUserActivities" :key="activity.user_id">
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
                  <!-- フィルタ結果がない場合 -->
                  <tr v-if="filteredUserActivities.length === 0 && !isUserActivitiesLoading">
                    <td colspan="6" class="text-center py-4">
                      <div class="text-muted">
                        <i class="fas fa-search fa-2x mb-3 opacity-6"></i>
                        <p class="text-sm mb-0">検索条件に一致するユーザー活動がありません</p>
                        <p class="text-xs text-secondary mb-0">フィルタ条件を変更してみてください</p>
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

    <!-- 通知一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-3">
            <div class="row mb-3">  
              <div class="col-lg-6 col-8">
                <h6>通知一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-bell text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">システム通知</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredNotifications.length }}件</span>
                </p>
              </div>
            </div>
            <!-- 検索・フィルターバー（通知専用） -->
            <div class="row">
              <div class="col-md-6 mb-2">
                <div class="input-group input-group-outline">
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="通知を検索（件名、送信先、本文）..."
                    v-model="notificationSearchQuery"
                  >
                </div>
              </div>
              <div class="col-md-3 mb-2">
                <select 
                  class="form-select" 
                  v-model="notificationStatusFilter"
                >
                  <option value="all">すべてのステータス</option>
                  <option value="QUEUED">送信待ち</option>
                  <option value="SENT">送信済み</option>
                  <option value="FAILED">送信失敗</option>
                  <option value="CANCELLED">キャンセル</option>
                </select>
              </div>
              <div class="col-md-3 mb-2">
                <button 
                  class="btn btn-sm btn-outline-secondary w-100"
                  @click="clearNotificationFilters"
                >
                  <i class="fa fa-times me-1"></i>
                  フィルタクリア
                </button>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- エラー表示 -->
            <div v-if="notificationsErrorMessage" class="alert alert-danger mx-3 mt-3" role="alert">
              {{ notificationsErrorMessage }}
            </div>
            
            <!-- 通知一覧テーブル（OptimizedDataTable） -->
            <div v-else class="px-3">
              <OptimizedDataTable 
                :data="filteredNotifications"
                :columns="notificationColumns"
                :loading="isNotificationsLoading"
                :page-size="10"
                :searchable="false"
                :filterable="false"
                empty-message="通知データがありません"
              >
                <!-- 件名セル：件名とプレビューを表示 -->
                <template #cell-subject="{ item }">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ item.subject }}</h6>
                    <p class="text-xs text-secondary mb-0">{{ item.body_text?.substring(0, 50) }}...</p>
                  </div>
                </template>

                <!-- ステータスセル：色付きバッジ表示 -->
                <template #cell-status="{ item }">
                  <div class="text-center">
                    <span :class="`badge ${getNotificationStatusColor(item.status)}`">
                      {{ getNotificationStatusLabel(item.status) }}
                    </span>
                  </div>
                </template>

                <!-- 作成日時セル：中央揃え -->
                <template #cell-created_at="{ value }">
                  <div class="text-center">
                    <span class="text-secondary text-xs font-weight-normal">
                      {{ new Date(value).toLocaleString('ja-JP') }}
                    </span>
                  </div>
                </template>

                <!-- 操作セル：編集・再送信・削除ボタン -->
                <template #cell-actions="{ item }">
                  <div class="btn-group" role="group">
                    <button 
                      class="btn btn-sm bg-gradient-info mb-0" 
                      @click="openEditNotificationModalById(item.id)"
                    >
                      編集
                    </button>
                    <button 
                      v-if="item.status === 'FAILED'" 
                      class="btn btn-sm bg-gradient-warning mb-0" 
                      @click="handleResendNotification(item.id)"
                    >
                      再送信
                    </button>
                    <button 
                      class="btn btn-sm bg-gradient-danger mb-0" 
                      @click="handleDeleteNotification(item.id)"
                    >
                      削除
                    </button>
                  </div>
                </template>
              </OptimizedDataTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- アラートルール一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-3">
            <div class="row mb-3">
              <div class="col-lg-6 col-8">
                <h6>アラートルール一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-cog text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">自動通知ルール</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredAlertRules.length }}件</span>
                </p>
              </div>
              <div class="col-lg-6 col-4 text-end">
                <button 
                  class="btn bg-gradient-primary btn-sm mb-0"
                  @click="openAlertRuleModal"
                >
                  <i class="fa fa-plus me-1"></i>
                  新規ルール登録
                </button>
              </div>
            </div>
            <!-- 検索バー（アラートルール専用） -->
            <div class="row">
              <div class="col-md-6 mb-2">
                <div class="input-group input-group-outline">
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="ルール名、タイプ、メールアドレスで検索..."
                    v-model="alertRuleSearchQuery"
                  >
                </div>
              </div>
              <div class="col-md-3 mb-2">
                <button 
                  class="btn btn-sm btn-outline-secondary w-100"
                  @click="clearAlertRuleFilters"
                >
                  <i class="fa fa-times me-1"></i>
                  フィルタクリア
                </button>
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
            
            <!-- アラートルール一覧テーブル（コンポーネント） -->
            <AlertRuleTable 
              v-else
              :rows="filteredAlertRules" 
              :loading="false"
              :selected-ids="Array.from(selectedAlertRules)"
              @select="(id, checked) => handleSelectAlertRule(id, checked)"
              @selectAll="(checked) => handleSelectAllAlertRules(checked)"
              @edit="openEditAlertRuleModalById" 
              @delete="handleDeleteAlertRule" 
            />
          </div>
        </div>
      </div>
    </div>


    <!-- TODO: プロジェクトメンバー管理機能（project_members テーブル作成後に有効化）
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
    -->

    <!-- 通知作成・編集モーダル（コンポーネント） -->
    <NotificationModal 
      v-if="showNotificationModal"
      :show="showNotificationModal"
      :initial="editingNotification ? {
        subject: notificationForm.subject,
        to_email: notificationForm.to_email,
        body_text: notificationForm.body_text,
      } : null"
      @close="closeNotificationModal"
      @save="onSaveNotification"
    />

    <!-- アラートルール作成・編集モーダル（コンポーネント） -->
    <AlertRuleModal 
      v-if="showAlertRuleModal"
      :show="showAlertRuleModal"
      :initial="editingAlertRule ? {
        project_id: alertRuleForm.project_id,
        name: alertRuleForm.name,
        rule_type: alertRuleForm.rule_type,
        notify_email: alertRuleForm.notify_email,
        is_enabled: alertRuleForm.is_enabled,
        params_json: alertRuleForm.params_json,
      } : null"
      @close="closeAlertRuleModal"
      @save="onSaveAlertRule"
    />

    <!-- ユーザープロフィールモーダル（統合版） -->
    <UserProfileModal
      :show="showUserProfileModal"
      :mode="userModalMode"
      :user="selectedUserProfile"
      :user-form="userForm"
      :user-profile-stats="userProfileStats"
      :user-activity-logs="userActivityLogs"
      :is-profile-stats-loading="isProfileStatsLoading"
      :is-activity-logs-loading="isActivityLogsLoading"
      @close="closeUserProfileModal"
      @save="handleSaveUser"
      @avatar-upload="handleAvatarUpload"
      @update:user-form="userForm = $event"
    />
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
