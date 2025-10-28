<script setup lang="ts">
// ユーザー管理テーブルコンポーネント
// 目的: ユーザー一覧の表示、選択、アクションを提供する再利用可能なコンポーネント

import { computed } from "vue";
import OptimizedDataTable from "@/components/table/OptimizedDataTable.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import PriorityBadge from "@/components/common/PriorityBadge.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { calculateUserPriority } from "@/utils/formatters";

// ユーザー情報の型定義（team.tsからインポート）
import type { User } from "@/types/team";
import type { TaskPriority } from "@/types/task";

// Props定義
interface Props {
  users: User[];
  filteredUsers: User[];
  selectedUsers: Set<number>;
  isLoading: boolean;
  errorMessage: string;
}

// Emits定義
interface Emits {
  (e: 'select-user', userId: number, checked: boolean): void;
  (e: 'select-all-users', checked: boolean): void;
  (e: 'view-profile', user: User): void;
  (e: 'edit-user', user: User): void;
  (e: 'create-user'): void;
  (e: 'bulk-activate-users'): void;
  (e: 'bulk-deactivate-users'): void;
  (e: 'bulk-delete-users'): void;
  (e: 'clear-selections'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 全選択状態を計算
const isAllSelected = computed(() => {
  return props.filteredUsers.length > 0 && 
         props.filteredUsers.every(user => props.selectedUsers.has(user.id));
});

// 一部選択状態を計算
const isIndeterminate = computed(() => {
  const selectedCount = props.filteredUsers.filter(user => props.selectedUsers.has(user.id)).length;
  return selectedCount > 0 && selectedCount < props.filteredUsers.length;
});

// ユーザーの重要度を取得（ログイン回数や最終ログイン日時を基に判定）
const getUserPriority = (user: User): TaskPriority => {
  return calculateUserPriority(user.login_count || 0, user.last_login_at || null);
};

// テーブルカラム定義
const userColumns = computed(() => [
  {
    key: "checkbox",
    label: "",
    sortable: false,
    width: "5%"
  },
  {
    key: "display_name",
    label: "ユーザー",
    sortable: true,
    width: "20%"
  },
  {
    key: "email",
    label: "メールアドレス",
    sortable: true,
    width: "25%"
  },
  {
    key: "is_active",
    label: "ステータス",
    sortable: true,
    filterable: true,
    width: "10%"
  },
  {
    key: "priority",
    label: "重要度",
    sortable: false,
    width: "10%"
  },
  {
    key: "created_at",
    label: "登録日",
    sortable: true,
    width: "15%",
    formatter: (value: string) => {
      return new Date(value).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    }
  },
  {
    key: "actions",
    label: "",
    sortable: false,
    width: "15%"
  }
]);

// イベントハンドラー
const handleSelectUser = (userId: number, checked: boolean) => {
  emit('select-user', userId, checked);
};

const handleSelectAllUsers = (checked: boolean) => {
  emit('select-all-users', checked);
};

const handleViewProfile = (user: User) => {
  emit('view-profile', user);
};

const handleEditUser = (user: User) => {
  emit('edit-user', user);
};

const handleCreateUser = () => {
  emit('create-user');
};

// 一括操作ハンドラー
const handleBulkActivateUsers = () => {
  emit('bulk-activate-users');
};

const handleBulkDeactivateUsers = () => {
  emit('bulk-deactivate-users');
};

const handleBulkDeleteUsers = () => {
  emit('bulk-delete-users');
};

const handleClearSelections = () => {
  emit('clear-selections');
};
</script>

<template>
  <!-- ユーザー一覧 -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card">
        <div class="card-header pb-0">
          <div class="row align-items-center">
            <div class="col-lg-6 col-7">
              <h6>ユーザー一覧</h6>
              <p class="text-sm mb-0">
                <i class="fa fa-users text-info" aria-hidden="true"></i>
                <span class="font-weight-bold ms-1">システムユーザー</span>の管理
                <span class="badge bg-gradient-info ms-2">{{ filteredUsers.length }}名</span>
              </p>
            </div>
            <div class="col-lg-6 col-5 text-end">
              <button 
                class="btn btn-sm bg-gradient-primary mb-0" 
                @click="handleCreateUser"
                title="新しいユーザーを追加"
              >
                <i class="material-symbols-rounded me-1">add</i>
                新しいユーザー
              </button>
            </div>
          </div>
        </div>

        <!-- 一括操作バー（選択時のみ表示） -->
        <Transition name="bulk-bar-slide">
          <div v-if="selectedUsers.size > 0" class="bulk-actions-bar">
            <div class="bulk-actions-content">
              <div class="bulk-actions-left">
                <i class="material-symbols-rounded text-white me-2">checklist</i>
                <span class="text-white fw-bold">{{ selectedUsers.size }}名のユーザーを選択中</span>
              </div>
              <div class="bulk-actions-right">
                <button 
                  class="btn btn-sm btn-success me-2" 
                  @click="handleBulkActivateUsers"
                  title="選択したユーザーをアクティブ化"
                >
                  <i class="material-symbols-rounded me-1">check_circle</i>
                  アクティブ化
                </button>
                <button 
                  class="btn btn-sm btn-warning me-2" 
                  @click="handleBulkDeactivateUsers"
                  title="選択したユーザーを非アクティブ化"
                >
                  <i class="material-symbols-rounded me-1">pause_circle</i>
                  非アクティブ化
                </button>
                <button 
                  class="btn btn-sm btn-danger me-2" 
                  @click="handleBulkDeleteUsers"
                  title="選択したユーザーを削除"
                >
                  <i class="material-symbols-rounded me-1">delete</i>
                  削除
                </button>
                <button 
                  class="btn btn-sm btn-outline-light" 
                  @click="handleClearSelections"
                  title="選択を解除"
                >
                  <i class="material-symbols-rounded">clear</i>
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <div class="card-body px-3 pt-3 pb-2">
          <!-- エラー表示 -->
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <!-- データが存在しない場合 -->
          <div v-else-if="!isLoading && filteredUsers.length === 0" class="p-3">
            <EmptyState 
              icon="person_off" 
              title="ユーザーが見つかりません" 
              subtitle="検索条件を変更するか、新しいユーザーを作成してください"
            >
              <template #actions>
                <button class="btn bg-gradient-primary" @click="handleCreateUser">
                  <i class="material-symbols-rounded me-1">add</i>
                  新しいユーザーを作成
                </button>
              </template>
            </EmptyState>
          </div>

          <!-- OptimizedDataTable -->
          <OptimizedDataTable
            v-else
            :data="filteredUsers as any"
            :columns="userColumns as any"
            :loading="isLoading"
            :page-size="20"
            :searchable="false"
            :filterable="false"
            empty-message="ユーザーが見つかりません"
          >
            <!-- ヘッダーチェックボックス（全選択用） -->
            <template #header-checkbox>
              <div class="text-center">
                <input 
                  type="checkbox" 
                  class="form-check-input"
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="handleSelectAllUsers(($event.target as HTMLInputElement).checked)"
                  title="全て選択/解除"
                >
              </div>
            </template>

            <!-- チェックボックス列 -->
            <template #cell-checkbox="{ item }">
              <div class="text-center">
                <input 
                  type="checkbox" 
                  class="form-check-input"
                  :checked="selectedUsers.has((item as unknown as User).id)"
                  @change="handleSelectUser((item as unknown as User).id, ($event.target as HTMLInputElement).checked)"
                >
              </div>
            </template>

            <!-- ユーザー名列 -->
            <template #cell-display_name="{ item }">
              <div class="d-flex px-2 py-1">
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">{{ (item as unknown as User).display_name }}</h6>
                  <p class="text-xs text-secondary mb-0">ID: {{ (item as unknown as User).id }}</p>
                </div>
              </div>
            </template>

            <!-- メールアドレス列 -->
            <template #cell-email="{ item }">
              <p class="text-xs font-weight-bold mb-0">{{ (item as unknown as User).email }}</p>
            </template>

            <!-- ステータス列 -->
            <template #cell-is_active="{ item }">
              <div class="text-center">
                <StatusBadge :status="(item as unknown as User).is_active ? 'active' : 'inactive'" />
              </div>
            </template>

            <!-- 重要度列 -->
            <template #cell-priority="{ item }">
              <div class="text-center">
                <PriorityBadge :priority="getUserPriority(item as unknown as User)" />
              </div>
            </template>

            <!-- アクション列 -->
            <template #cell-actions="{ item }">
              <div class="btn-group" role="group">
                <button 
                  class="btn btn-sm bg-gradient-info mb-0" 
                  @click="handleViewProfile(item as unknown as User)"
                  title="プロフィール"
                >
                  <i class="material-symbols-rounded text-sm">person</i>
                </button>
                <button 
                  class="btn btn-sm bg-gradient-primary mb-0" 
                  @click="handleEditUser(item as unknown as User)"
                  title="編集"
                >
                  <i class="material-symbols-rounded text-sm">edit</i>
                </button>
              </div>
            </template>
          </OptimizedDataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ユーザー管理テーブルのスタイリング */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* テーブルスタイリング */
.table th {
  border-top: none;
  font-weight: 600;
}

.table td {
  vertical-align: middle;
}

/* ボタンホバーエフェクト */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* バッジスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .btn-group .btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .table-responsive {
    font-size: 0.875rem;
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

/* 一括操作バー */
.bulk-actions-bar {
  background: linear-gradient(310deg, #7928ca 0%, #ff0080 100%);
  padding: 0.75rem 1.5rem;
  margin: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bulk-actions-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.bulk-actions-left {
  display: flex;
  align-items: center;
}

.bulk-actions-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bulk-actions-bar .btn {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.bulk-actions-bar .btn i {
  font-size: 18px;
}

/* 一括操作バーのアニメーション */
.bulk-bar-slide-enter-active,
.bulk-bar-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.bulk-bar-slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.bulk-bar-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .bulk-actions-bar {
    padding: 0.5rem 1rem;
  }

  .bulk-actions-content {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-actions-left {
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .bulk-actions-right {
    flex-wrap: wrap;
    justify-content: center;
  }

  .bulk-actions-bar .btn {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
    flex: 1;
    min-width: 100px;
  }

  .bulk-actions-bar .btn i {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .bulk-actions-bar .btn {
    flex: 1 1 100%;
  }
}
</style>
