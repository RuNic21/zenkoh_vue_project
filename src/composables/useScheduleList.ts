import { ref, computed, onMounted, watch } from "vue";
import router from "@/router";
import { useScheduleStore } from "@/store/schedule";
import { listProjects } from "@/services/projectService";
import { createTask as createTaskService } from "@/services/taskService";
import { triggerTaskAssignedNotification } from "@/utils/notificationTrigger";
import { getUserInfo } from "@/utils/userHelper";
import type { ScheduleItem } from "@/types/schedule";
import type { Project } from "@/types/project";
import type { TaskInsert } from "@/types/task";

// スケジュール一覧ページの状態とロジックを集約する composable
export function useScheduleList() {
  const store = useScheduleStore();
  const schedules = store.schedules;
  const isLoading = store.isLoading;
  const errorMessage = store.errorMessage;

  const projects = ref<Project[]>([]);
  
  // モーダル状態管理
  const showCreateModal = ref(false);
  const isSubmittingTask = ref(false);

  const loadProjects = async (): Promise<void> => {
    try {
      const result = await listProjects();
      projects.value = result.success && result.data ? result.data : [];
    } catch (e) {
      console.error("プロジェクトの読み込みに失敗", e);
      projects.value = [];
    }
  };

  const loadSchedulesFromDb = async (): Promise<void> => {
    try {
      await store.loadAll();
      await loadProjects();
    } catch (e) {
      console.error("スケジュールの読み込みに失敗", e);
    }
  };

  // フィルター初期化
  const resetFilters = (): void => {
    try {
      filterStatus.value = "all";
      searchQuery.value = "";
      assigneeQuery.value = "";
      selectedProjectId.value = null;
      tagFilter.value = [];
    } catch (e) {
      console.error("フィルター初期化に失敗", e);
    }
  };

  // フィルター
  const filterStatus = ref("all");
  const searchQuery = ref("");
  const assigneeQuery = ref("");
  const selectedProjectId = ref<number | null>(null);
  const tagFilter = ref<string[]>([]);   // 選択されたタグの配列
  
  // プロジェクトビューの選択状態（初期はnull: プロジェクト一覧表示）
  const selectedProjectView = ref<string | null>(null);

  const groupedSchedules = computed(() => {
    let filtered = schedules.value;
    
    // ステータスフィルター
    if (filterStatus.value !== "all") {
      filtered = filtered.filter((s) => s.status === filterStatus.value);
    }
    
    // 検索クエリフィルター（改善版：部分一致、複数単語対応）
    if (searchQuery.value) {
      // 検索クエリを小文字に変換し、余分な空白を削除
      const query = searchQuery.value.toLowerCase().trim();
      
      // 複数の単語をスペースで分割（AND検索）
      const keywords = query.split(/\s+/).filter(k => k.length > 0);
      
      filtered = filtered.filter((s) => {
        // 検索対象のテキストを結合（タイトル、説明など。プロジェクト名は除外）
        const searchableText = [
          s.title,
          s.description || ""
        ].join(" ").toLowerCase();
        
        // すべてのキーワードが含まれているかチェック（AND検索）
        return keywords.every(keyword => searchableText.includes(keyword));
      });
    }

    // 担当者名フィルター（部分一致、複数単語AND）
    if (assigneeQuery.value) {
      const query = assigneeQuery.value.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(k => k.length > 0);
      filtered = filtered.filter((s) => {
        const target = (s.assignee || "").toLowerCase();
        return keywords.every(keyword => target.includes(keyword));
      });
    }
    
    // プロジェクトフィルター
    if (selectedProjectId.value !== null) {
      const selectedProject = projects.value.find((p) => p.id === selectedProjectId.value);
      if (selectedProject) {
        filtered = filtered.filter((s) => s.category === selectedProject.name);
      }
    }
    
    // タグフィルタ（選択したタグのいずれかを含むタスクを表示）
    if (tagFilter.value.length > 0) {
      filtered = filtered.filter((s) => {
        const taskTags = s.tags || [];
        // 選択されたタグのいずれかがタスクに含まれているかチェック
        return tagFilter.value.some(selectedTag => 
          Array.isArray(taskTags) && taskTags.includes(selectedTag)
        );
      });
    }
    
    // プロジェクト別にグループ化
    const groups: { [key: string]: ScheduleItem[] } = {};
    filtered.forEach((s) => {
      const projectName = s.category || "プロジェクト未設定";
      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(s);
    });
    
    // 各プロジェクトのタスクを更新日時順（降順：最新が上）でソート
    Object.keys(groups).forEach((projectName) => {
      groups[projectName].sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA; // 降順（新しい順）
      });
    });
    
    return groups;
  });

  const projectStats = computed(() => {
    const stats: { [key: string]: { total: number; completed: number; inProgress: number; pending: number } } = {};
    Object.entries(groupedSchedules.value).forEach(([projectName, tasks]) => {
      stats[projectName] = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "DONE").length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        pending: tasks.filter((t) => t.status === "NOT_STARTED").length,
      };
    });
    return stats;
  });

  // フィルター適用済みのタスク一覧（統計表示用）
  const filteredSchedules = computed(() => {
    return Object.values(groupedSchedules.value).flat();
  });

  // 利用可能なタグ一覧（フィルタ用）
  const availableTags = computed(() => {
    const tags = new Set<string>();
    
    schedules.value.forEach((s) => {
      if (s.tags && Array.isArray(s.tags)) {
        s.tags.forEach(tag => {
          if (tag && tag.trim()) {
            tags.add(tag);
          }
        });
      }
    });
    
    return Array.from(tags).sort();
  });

  // 新規タスク作成モーダルを開く
  const addNewSchedule = () => {
    showCreateModal.value = true;
  };
  
  // モーダルを閉じる
  const closeCreateModal = () => {
    showCreateModal.value = false;
  };
  
  // タスク作成処理（モーダルから呼ばれる）
  const createTask = async (taskData: TaskInsert) => {
    isSubmittingTask.value = true;
    try {
      const result = await createTaskService(taskData);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "タスクの作成に失敗しました");
      }
      
      // 作成成功後、タスク割り当て通知を送信
      if (taskData.primary_assignee_id) {
        try {
          // 割り当て先ユーザー情報を取得
          const assigneeInfo = await getUserInfo(taskData.primary_assignee_id);
          
          // プロジェクト名を取得
          const project = projects.value.find(p => p.id === taskData.project_id);
          const projectName = project?.name || "不明なプロジェクト";
          
          if (assigneeInfo && assigneeInfo.email) {
            // タスク割り当て通知を送信
            await triggerTaskAssignedNotification(
              result.data,
              assigneeInfo.name,
              assigneeInfo.email,
              projectName
            );
          }
        } catch (notificationError) {
          // 通知送信失敗してもタスク作成は成功として扱う
          console.error("タスク割り当て通知の送信に失敗:", notificationError);
        }
      }
      
      // 作成成功後、スケジュールを再読み込み
      await loadSchedulesFromDb();
      closeCreateModal();
    } catch (e) {
      console.error("タスクの作成に失敗", e);
      const message = e instanceof Error ? e.message : "タスクの作成に失敗しました";
      errorMessage.value = message;
    } finally {
      isSubmittingTask.value = false;
    }
  };

  const editSchedule = (scheduleId: number) => {
    // スケジュールを選択してストアに保存
    store.selectSchedule(scheduleId);
    // タスク詳細ページに遷移（編集も詳細画面で実施）
    router.push({ name: "schedule-detail", params: { id: scheduleId } });
  };

  const deleteSchedule = async (scheduleId: number) => {
    if (!confirm("このスケジュールを削除しますか？")) return;
    try {
      await store.delete(scheduleId);
    } catch (e) {
      console.error("削除に失敗", e);
      const message = e instanceof Error ? e.message : "削除に失敗しました";
      errorMessage.value = message;
    }
  };

  const viewDetails = (scheduleId: number) => {
    // スケジュールを選択してストアに保存
    store.selectSchedule(scheduleId);
    // タスク詳細ページに遷移
    router.push({ name: "schedule-detail", params: { id: scheduleId } });
  };

  const handleFilterUpdate = (key: string, value: string | number | null) => {
    if (key === "status") filterStatus.value = value as string;
    else if (key === "project") selectedProjectId.value = value as number | null;
  };
  
  // プロジェクトを選択してタスク一覧を表示
  const selectProjectView = (projectName: string) => {
    selectedProjectView.value = projectName;
    // プロジェクトフィルターも同期（UIのフィルターバーを選択状態にする）
    const matched = projects.value.find((p) => p.name === projectName);
    selectedProjectId.value = matched ? matched.id : null;
  };
  
  // プロジェクト一覧に戻る
  const backToProjectList = () => {
    selectedProjectView.value = null;
  };

  // フィルターバーのプロジェクト選択変更に追随してビューを同期
  watch(selectedProjectId, (newProjectId) => {
    try {
      if (newProjectId === null) {
        // プロジェクト未選択 → 一覧ビューへ
        selectedProjectView.value = null;
        return;
      }
      const matchedProject = projects.value.find((p) => p.id === newProjectId);
      selectedProjectView.value = matchedProject ? matchedProject.name : null;
    } catch (e) {
      console.error("プロジェクト選択同期に失敗", e);
    }
  });

  onMounted(() => {
    loadSchedulesFromDb();
  });

  return {
    // state
    schedules,
    isLoading,
    errorMessage,
    projects,
    // modal state
    showCreateModal,
    isSubmittingTask,
    // filters
    filterStatus,
    searchQuery,
    assigneeQuery,
    selectedProjectId,
    tagFilter,
    availableTags,
    handleFilterUpdate,
    resetFilters,
    loadSchedulesFromDb,
    // computed
    groupedSchedules,
    projectStats,
    filteredSchedules,
    // view state
    selectedProjectView,
    selectProjectView,
    backToProjectList,
    // actions
    addNewSchedule,
    closeCreateModal,
    createTask,
    editSchedule,
    deleteSchedule,
    viewDetails,
  };
}


