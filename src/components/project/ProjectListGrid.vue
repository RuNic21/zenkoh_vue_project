<script setup lang="ts">
// プロジェクト一覧グリッド
// 目的: プロジェクト名→タスクリストへ導くカード群をグリッド表示

import ProjectCard from "./ProjectCard.vue";

interface Props {
  groupedSchedules: Record<string, any[]>; // プロジェクト名→タスクリスト
  projectStats: Record<string, { total: number; completed: number; inProgress: number; pending: number }>; // プロジェクト統計
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "select", name: string): void; // プロジェクト選択
}>();

const handleSelect = (name: string) => {
  // 選択時に親へ通知
  emit("select", name);
};
</script>

<template>
  <!-- プロジェクト一覧グリッド -->
  <div class="row">
    <div
      v-for="(tasks, projectName) in groupedSchedules"
      :key="projectName"
      class="col-lg-4 col-md-6 mb-4"
    >
      <ProjectCard
        :project-name="String(projectName)"
        :tasks-count="tasks.length"
        :stats="projectStats[projectName]"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<style scoped>
/* グリッド自体はBootstrapのレイアウトに委譲 */
</style>


