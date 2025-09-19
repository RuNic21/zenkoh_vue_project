// スケジュールのシンプルな共有ストア（Pinia 不使用のリアクティブ単一モジュール）
// 目的: 一覧/詳細/ダッシュボード間で同一データを共有し、一貫した状態を保つ

import { ref, computed } from "vue";
import type { ScheduleItem } from "../types/schedule";
import { createMockScheduleRepository } from "../services/scheduleService";

// 初期スケジュールデータ（デモ用）
const schedules = ref<ScheduleItem[]>([
  {
    id: 1,
    title: "プロジェクトA - 初期設計",
    description: "システムの基本設計とアーキテクチャの検討",
    startDate: "2024-01-15",
    endDate: "2024-01-30",
    status: "進行中",
    priority: "高",
    assignee: "田中太郎",
    progress: 65,
  },
  {
    id: 2,
    title: "プロジェクトB - 開発フェーズ",
    description: "フロントエンドとバックエンドの実装",
    startDate: "2024-01-20",
    endDate: "2024-02-15",
    status: "進行中",
    priority: "中",
    assignee: "佐藤花子",
    progress: 40,
  },
  {
    id: 3,
    title: "プロジェクトC - テスト",
    description: "システム全体のテストとバグ修正",
    startDate: "2024-02-01",
    endDate: "2024-02-20",
    status: "予定",
    priority: "低",
    assignee: "鈴木一郎",
    progress: 0,
  },
]);

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
  async loadAll() {
    const repo = createMockScheduleRepository();
    const list = await repo.list();
    schedules.value = list;
  },
  async save(item: ScheduleItem) {
    const repo = createMockScheduleRepository();
    await repo.update(item);
    updateSchedule(item);
  },
  async create(item: Omit<ScheduleItem, "id">) {
    const repo = createMockScheduleRepository();
    const created = await repo.create(item);
    schedules.value.push(created);
    return created;
  },
  async delete(id: number) {
    const repo = createMockScheduleRepository();
    await repo.remove(id);
    removeSchedule(id);
  },
});


