// スケジュールのシンプルな共有ストア（Pinia 不使用のリアクティブ単一モジュール）
// 目的: 一覧/詳細/ダッシュボード間で同一データを共有し、一貫した状態を保つ
// 新規: Task ベースの DB 連携に変更

import { ref, computed } from "vue";
import type { ScheduleItem } from "../types/schedule";
import { listTasksWithProject, createTask, updateTask, deleteTask } from "../services/taskService";
import { listUsers } from "../services/dbServices";
import { listProjects } from "../services/projectService";
import { tasksToScheduleItems, scheduleItemToTaskInsert, scheduleItemToTaskUpdate } from "../utils/taskAdapter";
import type { TaskWithProject } from "../types/task";
import type { Users } from "../types/db/users";
import type { Project } from "../types/project";

// スケジュールデータ（DB から取得）
const schedules = ref<ScheduleItem[]>([]);

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
  const newId = Math.max(0, ...schedules.value.map((s) => s.id)) + 1;
  schedules.value.push({ id: newId, progress: 0, status: "予定", priority: "中", ...item } as ScheduleItem);
};

const removeSchedule = (id: number) => {
  schedules.value = schedules.value.filter((s) => s.id !== id);
  if (selectedScheduleId.value === id) selectedScheduleId.value = null;
};

// ストアの公開 API
export const useScheduleStore = () => ({
  schedules,
  selectedScheduleId,
  selectedSchedule,
  selectSchedule,
  updateSchedule,
  addSchedule,
  removeSchedule,
  
  // DB から全スケジュールを読み込み
  async loadAll() {
    try {
      // タスクとプロジェクト情報を JOIN して取得
      const tasks = await listTasksWithProject();
      
      // ユーザー情報も取得（担当者名表示用）
      const users = await listUsers();
      
      // Task を ScheduleItem に変換
      const scheduleItems = tasksToScheduleItems(tasks, users);
      
      schedules.value = scheduleItems;
      console.log("スケジュールデータを DB から読み込みました:", scheduleItems.length, "件");
    } catch (error) {
      console.error("スケジュールデータの読み込みに失敗:", error);
      schedules.value = [];
    }
  },
  
  // スケジュールを保存（更新）
  async save(item: ScheduleItem) {
    try {
      // ScheduleItem を TaskUpdate に変換
      const taskUpdate = scheduleItemToTaskUpdate(item);
      
      // DB を更新
      const updatedTask = await updateTask(item.id, taskUpdate);
      
      if (updatedTask) {
        // ストアも更新
        updateSchedule(item);
        console.log("スケジュールを保存しました:", item.id);
      } else {
        throw new Error("タスクの更新に失敗しました");
      }
    } catch (error) {
      console.error("スケジュールの保存に失敗:", error);
      throw error;
    }
  },
  
  // 新しいスケジュールを作成
  async create(item: Omit<ScheduleItem, "id">) {
    try {
      // 利用可能なプロジェクト一覧を取得
      const projects = await listProjects();
      
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
      const createdTask = await createTask(taskInsert);
      
      if (createdTask) {
        // 作成されたタスクを ScheduleItem に変換してストアに追加
        const users = await listUsers();
        const scheduleItem = tasksToScheduleItems([createdTask], users)[0];
        
        schedules.value.push(scheduleItem);
        console.log("新しいスケジュールを作成しました:", scheduleItem.id);
        return scheduleItem;
      } else {
        throw new Error("タスクの作成に失敗しました");
      }
    } catch (error) {
      console.error("スケジュールの作成に失敗:", error);
      throw error;
    }
  },
  
  // スケジュールを削除
  async delete(id: number) {
    try {
      // DB から削除
      const success = await deleteTask(id);
      
      if (success) {
        // ストアからも削除
        removeSchedule(id);
        console.log("スケジュールを削除しました:", id);
      } else {
        throw new Error("タスクの削除に失敗しました");
      }
    } catch (error) {
      console.error("スケジュールの削除に失敗:", error);
      throw error;
    }
  },
});


