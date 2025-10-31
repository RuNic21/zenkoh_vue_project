// スケジュールのシンプルな共有ストア（Pinia 不使用のリアクティブ単一モジュール）
// 目的: 一覧/詳細/ダッシュボード間で同一データを共有し、一貫した状態を保つ
// 新規: Task ベースの DB 連携に変更

// TODO: DB連携されていない機能のストア実装が必要
// 1. コメント管理ストア
//    - コメント追加/削除/編集アクション実装が必要
//    - コメントデータリアルタイム同期実装が必要
//    - コメント権限管理ロジック実装が必要
//
// 2. 添付ファイル管理ストア
//    - ファイルアップロード/ダウンロード/削除アクション実装が必要
//    - ファイルメタデータ管理ロジック実装が必要
//    - ファイルサイズおよびタイプ検証ロジック実装が必要
//
// 3. タグ管理ストア
//    - タグ追加/削除アクション実装が必要
//    - タグ自動補完データ管理実装が必要
//    - タグ別フィルタリング状態管理実装が必要
//
// 4. メモ/ノート管理ストア
//    - メモ保存/ロードアクション実装が必要
//    - メモ履歴管理ロジック実装が必要
//    - メモバージョン管理システム実装が必要
//
// 5. ユーザー認証ストア
//    - 現在のユーザー情報管理実装が必要
//    - ユーザー権限チェックロジック実装が必要
//    - ログイン/ログアウト状態管理実装が必要
//
// 6. リアルタイム同期ストア
//    - WebSocket接続管理実装が必要
//    - データ変更通知システム実装が必要
//    - 競合解決ロジック実装が必要

import { ref, computed } from "vue";
import type { ScheduleItem } from "../types/schedule";
import { listTasksWithProject, createTask, updateTask, deleteTask, getTaskById } from "../services/taskService";
import { listUsers } from "../services/dbServices";
import { listProjects } from "../services/projectService";
import { tasksToScheduleItems, scheduleItemToTaskInsert, scheduleItemToTaskUpdate, findUserIdByName } from "../utils/taskAdapter";
import { triggerTaskAssignedNotification } from "../utils/notificationTrigger";
import { getUserInfo } from "../utils/userHelper";
import type { TaskWithProject } from "../types/task";
import type { Users } from "../types/db/users";
import type { Project } from "../types/project";

// スケジュールデータ（DB から取得）
const schedules = ref<ScheduleItem[]>([]);

// ローディング状態（API 呼び出し中の可視化に使用）
const isLoading = ref(false);

// エラー状態（ユーザーに分かりやすい日本語メッセージを表示）
const errorMessage = ref("");

// 選択中スケジュールID（一覧→詳細の連携に使用）
const selectedScheduleId = ref<number | null>(null);

// 選択中スケジュールの参照
const selectedSchedule = computed(() => {
  if (selectedScheduleId.value == null) return null;
  return schedules.value.find((s) => s.id === selectedScheduleId.value) || null;
});

// スケジュールを選択
const selectSchedule = (id: number | null) => {
  // 不正値対策: 存在しないIDは null 扱い
  if (id == null || !schedules.value.some((s) => s.id === id)) {
    selectedScheduleId.value = null;
    return;
  }
  selectedScheduleId.value = id;
};

// スケジュール更新（id が一致する要素を置換）
const updateSchedule = (updated: ScheduleItem) => {
  if (!updated || typeof updated.id !== "number") return;
  const index = schedules.value.findIndex((s) => s.id === updated.id);
  if (index !== -1) {
    schedules.value[index] = { ...schedules.value[index], ...updated };
  }
};

// 追加/削除（必要に応じて使用）
const addSchedule = (item: Partial<ScheduleItem>) => {
  // 最低限のバリデーション
  if (!item || !item.title) return;
  const maxId = schedules.value.length > 0 ? Math.max(...schedules.value.map((s) => s.id)) : 0;
  const newId = maxId + 1;
  schedules.value.push({ id: newId, progress: 0, status: "予定", priority: "中", ...item } as ScheduleItem);
};

const removeSchedule = (id: number) => {
  schedules.value = schedules.value.filter((s) => s.id !== id);
  if (selectedScheduleId.value === id) selectedScheduleId.value = null;
};

// ストアの公開 API
export const useScheduleStore = () => ({
  schedules,
  isLoading,
  errorMessage,
  selectedScheduleId,
  selectedSchedule,
  selectSchedule,
  updateSchedule,
  addSchedule,
  removeSchedule,
  
  // DB から全スケジュールを読み込み
  async loadAll() {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      // タスクとプロジェクト情報を JOIN して取得
      const tasksResult = await listTasksWithProject();
      if (!tasksResult.success || !tasksResult.data) {
        throw new Error(tasksResult.error || "タスクの取得に失敗しました");
      }
      
      // ユーザー情報も取得（担当者名表示用）
      const usersResult = await listUsers();
      const users = usersResult.success && usersResult.data ? usersResult.data : [];
      
      // Task を ScheduleItem に変換
      const scheduleItems = tasksToScheduleItems(tasksResult.data, users);
      
      schedules.value = scheduleItems;
      console.log("スケジュールデータを DB から読み込みました:", scheduleItems.length, "件");
    } catch (error) {
      console.error("スケジュールデータの読み込みに失敗:", error);
      schedules.value = [];
      errorMessage.value = "スケジュールの読み込みに失敗しました。しばらくしてから再試行してください。";
    } finally {
      isLoading.value = false;
    }
  },
  
  // スケジュールを保存（更新）
  async save(item: ScheduleItem) {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      
      // 更新前のタスク情報を取得（割り当て先変更検知用）
      const previousTaskResult = await getTaskById(item.id);
      const previousAssigneeId = previousTaskResult.success && previousTaskResult.data 
        ? previousTaskResult.data.primary_assignee_id 
        : null;
      
      // ScheduleItem を TaskUpdate に変換
      let taskUpdate = scheduleItemToTaskUpdate(item);
      let newAssigneeId: number | null | undefined = undefined;

      // 主担当（表示名 → ユーザーID）に変換して保存
      // 注意: users 取得に失敗した場合はスキップ（他フィールドのみ保存）
      try {
        const usersRes = await listUsers();
        if (usersRes.success && usersRes.data) {
          const assigneeUserId = findUserIdByName(item.assignee || "", usersRes.data);
          if (assigneeUserId) {
            taskUpdate = { ...taskUpdate, primary_assignee_id: assigneeUserId };
            newAssigneeId = assigneeUserId;
          }
        }
      } catch (e) {
        // サイレントに継続（担当者以外の更新は反映させる）
        console.warn("担当者ID変換に失敗しましたが、他の項目は保存を続行します", e);
      }
      
      // DB を更新
      const result = await updateTask(item.id, taskUpdate);
      
      if (result.success && result.data) {
        // 割り当て先が変更された場合、通知を送信
        if (newAssigneeId !== undefined && newAssigneeId !== previousAssigneeId && newAssigneeId !== null) {
          try {
            // 新しい割り当て先のユーザー情報を取得
            const assigneeInfo = await getUserInfo(newAssigneeId);
            
            // プロジェクト名を取得
            const projectsResult = await listProjects();
            const projects = projectsResult.success && projectsResult.data ? projectsResult.data : [];
            const project = projects.find(p => p.id === result.data.project_id);
            const projectName = project?.name || "不明なプロジェクト";
            
            if (assigneeInfo && assigneeInfo.email) {
              // タスク割り当て通知を送信
              await triggerTaskAssignedNotification(
                result.data,
                assigneeInfo.name,
                assigneeInfo.email,
                projectName
              );
              console.log("✅ タスク再割り当て通知を送信しました");
            }
          } catch (notificationError) {
            // 通知送信失敗してもタスク更新は成功として扱う
            console.warn("⚠️ タスク再割り当て通知の送信に失敗:", notificationError);
          }
        }
        
        // サーバーで確定した値から ScheduleItem を再構築し、ストアを正とする
        try {
          const usersRes = await listUsers();
          const users = usersRes.success && usersRes.data ? usersRes.data : [];
          const updatedItems = tasksToScheduleItems([result.data as unknown as TaskWithProject], users);
          if (updatedItems.length) {
            updateSchedule(updatedItems[0]);
          } else {
            updateSchedule(item); // フォールバック
          }
        } catch (e) {
          // ユーザー取得に失敗した場合は、入力値で更新（限定的）
          updateSchedule(item);
        }
        console.log("スケジュールを保存しました:", item.id);
      } else {
        throw new Error(result.error || "タスクの更新に失敗しました");
      }
    } catch (error) {
      console.error("スケジュールの保存に失敗:", error);
      errorMessage.value = "スケジュールの保存に失敗しました。入力内容を確認して再試行してください。";
      throw error;
    } finally {
      isLoading.value = false;
    }
  },
  
  // 新しいスケジュールを作成
  async create(item: Omit<ScheduleItem, "id">) {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      // 利用可能なプロジェクト一覧を取得
      const projectsResult = await listProjects();
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error(projectsResult.error || "プロジェクトの取得に失敗しました");
      }
      const projects = projectsResult.data;
      
      if (projects.length === 0) {
        throw new Error("利用可能なプロジェクトがありません。先にプロジェクトを作成してください。");
      }
      
      // 最初のプロジェクトをデフォルトとして使用（またはアーカイブされていない最初のプロジェクト）
      const activeProjects = projects.filter(p => !p.is_archived);
      const defaultProject = activeProjects.length > 0 ? activeProjects[0] : projects[0];
      
      console.log("デフォルトプロジェクトを選択:", defaultProject.name, "(ID:", defaultProject.id, ")");
      
      // ScheduleItem を TaskInsert に変換
      const taskInsert = scheduleItemToTaskInsert(item, defaultProject.id);
      
      // DB に作成
      const result = await createTask(taskInsert);
      
      if (result.success && result.data) {
        // 作成されたタスクを ScheduleItem に変換してストアに追加
        const usersResult = await listUsers();
        const users = usersResult.success && usersResult.data ? usersResult.data : [];
        const scheduleItems = tasksToScheduleItems([result.data], users);
        
        if (scheduleItems.length > 0) {
          const scheduleItem = scheduleItems[0];
          schedules.value.push(scheduleItem);
          console.log("新しいスケジュールを作成しました:", scheduleItem.id);
          return scheduleItem;
        } else {
          throw new Error("スケジュールアイテムの変換に失敗しました");
        }
      } else {
        throw new Error(result.error || "タスクの作成に失敗しました");
      }
    } catch (error) {
      console.error("スケジュールの作成に失敗:", error);
      errorMessage.value = "スケジュールの作成に失敗しました。しばらくしてから再試行してください。";
      throw error;
    } finally {
      isLoading.value = false;
    }
  },
  
  // スケジュールを削除
  async delete(id: number) {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      // DB から削除
      const result = await deleteTask(id);
      
      if (result.success && result.data) {
        // ストアからも削除
        removeSchedule(id);
        console.log("スケジュールを削除しました:", id);
      } else {
        throw new Error(result.error || "タスクの削除に失敗しました");
      }
    } catch (error) {
      console.error("スケジュールの削除に失敗:", error);
      errorMessage.value = "スケジュールの削除に失敗しました。しばらくしてから再試行してください。";
      throw error;
    } finally {
      isLoading.value = false;
    }
  },
});


