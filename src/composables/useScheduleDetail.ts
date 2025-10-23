import { ref, computed, onMounted, watch } from "vue";
import { useScheduleStore } from "@/store/schedule";
import { listUsers } from "@/services/dbServices";
import type { ScheduleItem, ScheduleStatus, SchedulePriority, ScheduleAttachment, ScheduleComment } from "@/types/schedule";

// スケジュール詳細の状態とロジックを集約する composable
export function useScheduleDetail() {
  const store = useScheduleStore();
  const isLoading = store.isLoading;
  const errorMessage = ref("");

  const scheduleDetail = computed<ScheduleItem>(() => {
    const base: ScheduleItem = {
      id: 0,
      title: "スケジュール未選択",
      description: "左の一覧からスケジュールを選択してください",
      startDate: "",
      endDate: "",
      status: "NOT_STARTED" as ScheduleStatus,
      priority: "MEDIUM" as SchedulePriority,
      assignee: "",
      progress: 0,
      category: "",
      tags: [],
      notes: "",
      attachments: [],
      comments: [],
    };
    const src = (store.selectedSchedule.value as ScheduleItem | null) || ({} as Partial<ScheduleItem>);
    return {
      ...base,
      ...src,
      tags: Array.isArray(src.tags) ? src.tags : base.tags,
      attachments: Array.isArray(src.attachments) ? src.attachments : base.attachments,
      comments: Array.isArray(src.comments) ? src.comments : base.comments,
      notes: typeof src.notes === "string" ? src.notes : base.notes,
      category: typeof src.category === "string" ? src.category : base.category,
    } as ScheduleItem;
  });

  // 編集フォーム
  const isEditMode = ref(false);
  const editForm = ref<ScheduleItem>({ ...scheduleDetail.value });
  watch(scheduleDetail, (val) => {
    editForm.value = { ...val };
  });

  // コメント/タグ
  const newComment = ref("");
  const newTag = ref("");
  const availableTags = ref<string[]>([]);

  // モーダル
  const showTagModal = ref(false);
  const showFileModal = ref(false);

  // 状態履歴
  const statusHistory = ref<Array<{ from: string; to: string; user: string; timestamp: string; reason: string }>>([]);

  // ユーザー
  const availableUsers = ref<Array<{ id: number; name: string; avatar: string }>>([]);
  const loadUsers = async () => {
    try {
      const result = await listUsers();
      if (result.success && result.data) {
        availableUsers.value = result.data.map((user) => ({
          id: user.id,
          name: user.display_name,
          avatar: user.avatar_url || "",
        }));
      }
    } catch (e) {
      console.error("ユーザーの読み込みに失敗", e);
    }
  };

  // アクション（ストアに実装済みの create/update/delete は既存を利用）
  const changeStatus = (status: ScheduleStatus) => {
    editForm.value.status = status;
  };
  const changePriority = (priority: SchedulePriority) => {
    editForm.value.priority = priority;
  };
  const changeProgress = (progress: number) => {
    editForm.value.progress = Math.max(0, Math.min(100, Math.round(progress)));
  };
  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    if (!editForm.value.tags.includes(tag)) editForm.value.tags.push(tag);
    newTag.value = "";
  };
  const removeTag = (tag: string) => {
    editForm.value.tags = editForm.value.tags.filter((t) => t !== tag);
  };
  const addComment = (text: string) => {
    if (!text.trim()) return;
    
    // ScheduleCommentの正しい型でコメントを作成
    const comment: ScheduleComment = {
      id: Date.now(),
      user: "ユーザー",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    
    editForm.value.comments.push(comment);
    newComment.value = "";
  };

  onMounted(async () => {
    await loadUsers();
  });

  return {
    // state
    isLoading,
    errorMessage,
    scheduleDetail,
    isEditMode,
    editForm,
    newComment,
    newTag,
    availableTags,
    showTagModal,
    showFileModal,
    statusHistory,
    availableUsers,
    // actions
    changeStatus,
    changePriority,
    changeProgress,
    addTag,
    removeTag,
    addComment,
  };
}


