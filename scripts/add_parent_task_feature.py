#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ScheduleDetail.vue에 부모 태스크 등록 기능 추가 스크립트
"""

import re
import sys
from pathlib import Path

def modify_schedule_detail_vue(file_path: str):
    """ScheduleDetail.vue 파일을 수정합니다."""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. composable에서 반환하는 값 추가
    pattern1 = r'(  availableUsers,     // 選択可能ユーザー一覧\n)'
    replacement1 = r'\1  availableParentTasks, // 選択可能な親タスク一覧\n  isLoadingParentTasks, // 親タスク読み込み中フラグ\n'
    content = re.sub(pattern1, replacement1, content)
    
    pattern2 = r'(  loadTaskById,       // タスク読み込み関数\n)'
    replacement2 = r'\1  loadParentTasks,    // 親タスク候補読み込み関数\n'
    content = re.sub(pattern2, replacement2, content)
    
    # 2. 부모 태스크 변경 함수 추가
    pattern3 = r'(// 担当者変更\nconst changeAssignee = \(userId: number\) => \{\n  const user = availableUsers\.value\.find\(u => u\.id === userId\);\n  if \(user\) \{\n    editForm\.value\.assignee = user\.name;\n  \}\n\};\n\n)(// クイックアクション実行)'
    replacement3 = r'\1// 親タスク変更\nconst changeParentTask = (taskId: number | null) => {\n  if (taskId === null || taskId === 0) {\n    // 親タスクを解除\n    editForm.value.parentTaskId = null;\n    editForm.value.parentTaskName = undefined;\n  } else {\n    // 親タスクを設定\n    const parentTask = availableParentTasks.value.find(t => t.id === taskId);\n    if (parentTask) {\n      editForm.value.parentTaskId = parentTask.id;\n      editForm.value.parentTaskName = parentTask.task_name;\n    }\n  }\n};\n\n\2'
    content = re.sub(pattern3, replacement3, content)
    
    # 3. UI 추가 (タグ 섹션 전에)
    ui_section = '''        <!-- 親タスク -->
        <div class="card mb-4">
          <CardHeader title="親タスク" subtitle="このタスクの親タスクを設定できます" />
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label text-sm">親タスク</label>
              <template v-if="isEditMode">
                <select
                  class="form-select form-select-sm"
                  :value="editForm.parentTaskId || null"
                  @change="changeParentTask(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                >
                  <option :value="null">親タスクなし</option>
                  <option 
                    v-for="task in availableParentTasks" 
                    :key="task.id" 
                    :value="task.id"
                  >
                    {{ task.task_name }}
                  </option>
                </select>
                <div v-if="isLoadingParentTasks" class="text-muted text-xs mt-2">
                  <i class="material-symbols-rounded" style="font-size: 0.875rem;">sync</i>
                  親タスク候補を読み込み中...
                </div>
              </template>
              <template v-else>
                <p v-if="scheduleDetail.parentTaskName" class="form-control-plaintext">
                  <i class="material-symbols-rounded me-1" style="font-size: 1rem;">account_tree</i>
                  {{ scheduleDetail.parentTaskName }}
                </p>
                <p v-else class="form-control-plaintext text-muted">
                  親タスクが設定されていません
                </p>
              </template>
            </div>
          </div>
        </div>

'''
    
    pattern4 = r'(          </div>\n        </div>\n\n        <!-- タグ -->)'
    replacement4 = r'\1' + ui_section + r'        <!-- タグ -->'
    content = re.sub(pattern4, replacement4, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ {file_path} 파일이 성공적으로 수정되었습니다.")

if __name__ == '__main__':
    file_path = Path(__file__).parent.parent / 'src' / 'pages' / 'ScheduleDetail.vue'
    modify_schedule_detail_vue(str(file_path))


