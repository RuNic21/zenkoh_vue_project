import { ref, onMounted } from "vue";
import type { TeamMemberWithUser, TeamRole } from "@/types/team";
import { listTeamMembersWithUsers, addTeamMember, updateTeamMemberRole, removeTeamMember, searchUsers } from "@/services/teamService";

// チームメンバー管理の状態とロジックを集約
export function useTeamMembersManagement(projectId?: number) {
  const members = ref<TeamMemberWithUser[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const candidateUsers = ref<Array<{ id: number; display_name: string }>>([]);
  const isSearching = ref(false);

  const loadMembers = async () => {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      const res = await listTeamMembersWithUsers(projectId);
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
    try {
      const res = await addTeamMember({ projectId, userId, role });
      if (res.success) await loadMembers();
      else throw new Error(res.error || "メンバー追加に失敗しました");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const changeRole = async (memberId: string, role: TeamRole) => {
    try {
      const res = await updateTeamMemberRole(memberId, role);
      if (res.success) await loadMembers();
      else throw new Error(res.error || "役割変更に失敗しました");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const res = await removeTeamMember(memberId);
      if (res.success) await loadMembers();
      else throw new Error(res.error || "メンバー削除に失敗しました");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const searchCandidateUsers = async (query: string) => {
    try {
      isSearching.value = true;
      const res = await searchUsers(query);
      candidateUsers.value = res.success && res.data ? res.data : [];
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


