import { ref, onMounted } from "vue";
import type { ProjectTeam } from "@/types/team";
import { getProjectTeams } from "@/services/teamService";

// プロジェクト別チーム管理の状態とロジックを集約
export function useProjectTeamsManagement() {
  const projectTeams = ref<ProjectTeam[]>([]);
  const isProjectTeamsLoading = ref(false);
  const projectTeamsErrorMessage = ref("");

  const loadProjectTeams = async () => {
    try {
      isProjectTeamsLoading.value = true;
      projectTeamsErrorMessage.value = "";
      const result = await getProjectTeams();
      if (result.success && result.data) {
        projectTeams.value = result.data as ProjectTeam[];
      } else {
        projectTeams.value = [];
        projectTeamsErrorMessage.value = result.error || "プロジェクトチームの読み込みに失敗しました";
      }
    } catch (e) {
      console.error("プロジェクトチーム読み込みに失敗:", e);
      projectTeams.value = [];
      projectTeamsErrorMessage.value = "プロジェクトチームの読み込みに失敗しました";
    } finally {
      isProjectTeamsLoading.value = false;
    }
  };

  onMounted(loadProjectTeams);

  return {
    projectTeams,
    isProjectTeamsLoading,
    projectTeamsErrorMessage,
    loadProjectTeams,
  };
}


