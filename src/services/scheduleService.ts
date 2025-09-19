// スケジュール用リポジトリインターフェースとモック実装
// 目的: 後から Supabase 実装に差し替えやすいように統一 API を提供

import { ref } from "vue";
import type { ScheduleItem } from "../types/schedule";

export interface ScheduleRepository {
  list(): Promise<ScheduleItem[]>;
  getById(id: number): Promise<ScheduleItem | null>;
  create(item: Omit<ScheduleItem, "id">): Promise<ScheduleItem>;
  update(item: ScheduleItem): Promise<void>;
  remove(id: number): Promise<void>;
}

// テスト用シードデータ
const seedData = ref<ScheduleItem[]>([
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
    category: "開発",
    tags: ["設計", "アーキテクチャ"],
    notes: "初期設計進行中",
    attachments: [],
    comments: [],
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
    category: "開発",
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
    category: "テスト",
  },
]);

// モック実装
export const createMockScheduleRepository = (): ScheduleRepository => {
  return {
    async list() {
      // 遅延を模倣
      await new Promise((r) => setTimeout(r, 100));
      return [...seedData.value];
    },
    async getById(id: number) {
      await new Promise((r) => setTimeout(r, 50));
      return seedData.value.find((s) => s.id === id) || null;
    },
    async create(item) {
      await new Promise((r) => setTimeout(r, 80));
      const newId = Math.max(0, ...seedData.value.map((s) => s.id)) + 1;
      const created: ScheduleItem = { id: newId, progress: 0, status: "予定", priority: "中", assignee: "", title: "", description: "", startDate: "", endDate: "", ...item };
      seedData.value.push(created);
      return created;
    },
    async update(item) {
      await new Promise((r) => setTimeout(r, 80));
      const idx = seedData.value.findIndex((s) => s.id === item.id);
      if (idx !== -1) seedData.value[idx] = { ...seedData.value[idx], ...item };
    },
    async remove(id) {
      await new Promise((r) => setTimeout(r, 50));
      seedData.value = seedData.value.filter((s) => s.id !== id);
    },
  };
};


