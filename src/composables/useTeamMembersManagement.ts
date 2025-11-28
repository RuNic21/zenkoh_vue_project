import { ref, onMounted } from "vue";
import type { TeamMemberWithUser, TeamRole, TeamMemberInsert, TeamMemberUpdate } from "@/types/team";
import { listTeamMembersWithUsers, addTeamMember, updateTeamMemberRole, removeTeamMember, searchUsers } from "@/services/teamService";

// チームメンバー管理の状態とロジックを集約
// 注意: 現在のスキーマでは task_members テーブルを使用するため、taskId が必要です
export function useTeamMembersManagement(taskId?: number) {
  const members = ref<TeamMemberWithUser[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const candidateUsers = ref<Array<{ id: number; display_name: string }>>([]);
  const isSearching = ref(false);

  const loadMembers = async () => {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      const res = await listTeamMembersWithUsers(taskId);
      if (res.success && res.data) {
        members.value = res.data as TeamMemberWithUser[];
      } else {
        members.value = [];
        errorMessage.value = res.error || "メンバーの読み込みに失敗しました";
      }
    } catch (e) {
      console.error("メンバー読み込みに失敗:", e);
      members.value = [];
      errorMessage.value = "メンバーの読み込みに失敗しました";
    } finally {
      isLoading.value = false;
    }
  };

  const addMember = async (userId: number, role: TeamRole) => {
    if (!taskId) {
      throw new Error("タスクIDが指定されていません");
    }
    try {
      const payload: TeamMemberInsert = {
        user_id: userId,
        task_id: taskId,
        role: role
      };
      const res = await addTeamMember(payload);
      if (res) {
        await loadMembers();
      } else {
        throw new Error("メンバー追加に失敗しました");
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const changeRole = async (userId: number, role: TeamRole) => {
    if (!taskId) {
      throw new Error("タスクIDが指定されていません");
    }
    try {
      const payload: TeamMemberUpdate = { role: role };
      const res = await updateTeamMemberRole(userId, taskId, payload);
      if (res) {
        await loadMembers();
      } else {
        throw new Error("役割変更に失敗しました");
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const removeMember = async (userId: number) => {
    if (!taskId) {
      throw new Error("タスクIDが指定されていません");
    }
    try {
      const success = await removeTeamMember(userId, taskId);
      if (success) {
        await loadMembers();
      } else {
        throw new Error("メンバー削除に失敗しました");
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const searchCandidateUsers = async (query: string) => {
    try {
      isSearching.value = true;
      const users = await searchUsers(query);
      candidateUsers.value = users.map(user => ({
        id: user.id,
        display_name: user.display_name || user.email || ""
      }));
    } catch (e) {
      console.error("ユーザー検索に失敗:", e);
      candidateUsers.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  onMounted(loadMembers);

  return {
    members,
    isLoading,
    errorMessage,
    candidateUsers,
    isSearching,
    loadMembers,
    addMember,
    changeRole,
    removeMember,
    searchCandidateUsers,
  };
}


