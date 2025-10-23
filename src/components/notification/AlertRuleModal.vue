<script setup lang="ts">
// アラートルール作成/編集モーダル
// 目的: プロジェクト、ルールタイプ、パラメータを設定してアラートルールを作成・編集
import { ref, watch, computed, onMounted } from "vue";
import { listProjects } from "@/services/projectService";
import type { Project } from "@/types/project";
import type { AlertRuleType } from "@/types/notification";

type RuleForm = {
  project_id: number | null;
  name: string;
  rule_type: AlertRuleType;
  notify_email: string;
  is_enabled: boolean;
  params_json: Record<string, any>;
};

const props = defineProps<{
  show: boolean;
  initial?: Partial<RuleForm> | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", form: RuleForm): void;
}>();

// リアクティブデータ
const projects = ref<Project[]>([]);
const isLoadingProjects = ref(false);

const form = ref<RuleForm>({
  project_id: null,
  name: "",
  rule_type: "DUE_SOON",
  notify_email: "",
  is_enabled: true,
  params_json: {}
});

// ルールタイプのオプション
const ruleTypeOptions: { value: AlertRuleType; label: string; description: string }[] = [
  { 
    value: "DUE_SOON", 
    label: "期限間近", 
    description: "タスクの期限が近づいたときに通知" 
  },
  { 
    value: "OVERDUE", 
    label: "期限超過", 
    description: "タスクの期限が過ぎたときに通知" 
  },
  { 
    value: "NO_PROGRESS", 
    label: "進捗なし", 
    description: "一定期間進捗がないタスクを通知" 
  },
  { 
    value: "CUSTOM", 
    label: "カスタム", 
    description: "自由にパラメータを設定" 
  }
];

// ルールタイプごとのパラメータ設定
const ruleParams = ref<any>({
  days_before: 3,
  days_overdue: 1,
  days_no_progress: 7,
  min_progress_percent: 0,
  target_status: "IN_PROGRESS",
  custom_json: "{}"
});

// プロジェクト一覧取得
const loadProjects = async () => {
  isLoadingProjects.value = true;
  try {
    const result = await listProjects({ is_archived: false });
    if (result.success && result.data) {
      projects.value = result.data;
    }
  } catch (error) {
    console.error("プロジェクト一覧取得エラー:", error);
  } finally {
    isLoadingProjects.value = false;
  }
};

// 初期値設定
watch(() => props.initial, (v) => {
  if (v) {
    form.value = {
      project_id: v.project_id ?? null,
      name: v.name ?? "",
      rule_type: v.rule_type ?? "DUE_SOON",
      notify_email: v.notify_email ?? "",
      is_enabled: v.is_enabled ?? true,
      params_json: v.params_json ?? {}
    };
    
    // パラメータ復元
    if (v.params_json) {
      if (v.params_json.days_before !== undefined) {
        ruleParams.value.days_before = v.params_json.days_before;
      }
      if (v.params_json.days_overdue !== undefined) {
        ruleParams.value.days_overdue = v.params_json.days_overdue;
      }
      if (v.params_json.days_no_progress !== undefined) {
        ruleParams.value.days_no_progress = v.params_json.days_no_progress;
      }
      if (v.params_json.min_progress_percent !== undefined) {
        ruleParams.value.min_progress_percent = v.params_json.min_progress_percent;
      }
      if (v.params_json.target_status !== undefined) {
        ruleParams.value.target_status = v.params_json.target_status;
      }
    }
  } else {
    // 新規作成時のデフォルト値
    form.value = {
      project_id: null,
      name: "",
      rule_type: "DUE_SOON",
      notify_email: "",
      is_enabled: true,
      params_json: {}
    };
    ruleParams.value = {
      days_before: 3,
      days_overdue: 1,
      days_no_progress: 7,
      min_progress_percent: 0,
      target_status: "IN_PROGRESS",
      custom_json: "{}"
    };
  }
}, { immediate: true });

// バリデーション
const canSave = computed(() => {
  if (!form.value.project_id) {
    console.log("❌ プロジェクトが選択されていません");
    return false;
  }
  if (!form.value.name.trim()) {
    console.log("❌ ルール名が入力されていません");
    return false;
  }
  if (!form.value.notify_email.trim()) {
    console.log("❌ メールアドレスが入力されていません");
    return false;
  }
  
  // メールアドレスの簡易検証
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.value.notify_email)) {
    console.log("❌ メールアドレスの形式が正しくありません:", form.value.notify_email);
    return false;
  }
  
  console.log("✅ すべての検証をパスしました");
  return true;
});

// バリデーションエラーメッセージ
const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (!form.value.project_id) {
    errors.push("プロジェクトを選択してください");
  }
  if (!form.value.name.trim()) {
    errors.push("ルール名を入力してください");
  }
  if (!form.value.notify_email.trim()) {
    errors.push("メールアドレスを入力してください");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.value.notify_email)) {
      errors.push("正しいメールアドレス形式で入力してください");
    }
  }
  
  return errors;
});

// params_jsonを生成
const buildParamsJson = (): Record<string, any> => {
  const params: Record<string, any> = {};
  
  switch (form.value.rule_type) {
    case "DUE_SOON":
      params.days_before = ruleParams.value.days_before;
      params.target_status = ruleParams.value.target_status;
      break;
    case "OVERDUE":
      params.days_overdue = ruleParams.value.days_overdue;
      params.target_status = ruleParams.value.target_status;
      break;
    case "NO_PROGRESS":
      params.days_no_progress = ruleParams.value.days_no_progress;
      params.min_progress_percent = ruleParams.value.min_progress_percent;
      break;
    case "CUSTOM":
      try {
        params.custom = JSON.parse(ruleParams.value.custom_json || "{}");
      } catch (e) {
        params.custom = {};
      }
      break;
  }
  
  return params;
};

// 保存処理
const onSave = () => {
  if (!canSave.value) return;
  
  const finalForm: RuleForm = {
    ...form.value,
    params_json: buildParamsJson()
  };
  
  emit("save", finalForm);
};

// 閉じる処理
const onClose = () => emit("close");

// マウント時にプロジェクト一覧取得
onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div
    class="modal fade"
    :class="{ show: show }"
    style="display: block"
    v-if="show"
    tabindex="-1"
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ initial ? "アラートルールを編集" : "アラートルールを作成" }}
          </h5>
          <button type="button" class="btn-close" aria-label="Close" @click="onClose"></button>
        </div>
        <div class="modal-body">
          <!-- プロジェクト選択 -->
          <div class="mb-3">
            <label class="form-label">
              <i class="fa fa-folder text-primary me-1"></i>
              プロジェクト <span class="text-danger">*</span>
            </label>
            <select
              class="form-select"
              v-model.number="form.project_id"
              :disabled="isLoadingProjects"
              :class="{ 'is-invalid': !form.project_id && validationErrors.length > 0 }"
            >
              <option :value="null">プロジェクトを選択してください</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
            <small class="text-muted">アラートルールを適用するプロジェクトを選択</small>
          </div>

          <!-- ルール名 -->
          <div class="mb-3">
            <label class="form-label">
              <i class="fa fa-tag text-info me-1"></i>
              ルール名 <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              class="form-control"
              v-model="form.name"
              placeholder="例: タスク期限3日前の通知"
              :class="{ 'is-invalid': !form.name.trim() && validationErrors.length > 0 }"
            />
            <small class="text-muted">わかりやすいルール名を入力してください</small>
          </div>

          <!-- ルールタイプ -->
          <div class="mb-3">
            <label class="form-label">
              <i class="fa fa-cog text-warning me-1"></i>
              ルールタイプ <span class="text-danger">*</span>
            </label>
            <select class="form-select" v-model="form.rule_type">
              <option
                v-for="option in ruleTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }} - {{ option.description }}
              </option>
            </select>
          </div>

          <!-- ルールパラメータ（タイプ別） -->
          <div class="card mb-3">
            <div class="card-body">
              <h6 class="card-title">ルールパラメータ</h6>

              <!-- DUE_SOON (期限間近) -->
              <div v-if="form.rule_type === 'DUE_SOON'">
                <div class="mb-3">
                  <label class="form-label">期限何日前に通知？</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="ruleParams.days_before"
                    min="1"
                    max="30"
                  />
                  <small class="text-muted">例: 3日前に通知する場合は「3」</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">対象タスクの状態</label>
                  <select class="form-select" v-model="ruleParams.target_status">
                    <option value="NOT_STARTED">未着手</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="DONE">完了</option>
                    <option value="DELAYED">遅延</option>
                    <option value="HOLD">保留</option>
                  </select>
                </div>
              </div>

              <!-- OVERDUE (期限超過) -->
              <div v-else-if="form.rule_type === 'OVERDUE'">
                <div class="mb-3">
                  <label class="form-label">期限超過何日後に通知？</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="ruleParams.days_overdue"
                    min="0"
                    max="30"
                  />
                  <small class="text-muted">例: 期限当日に通知する場合は「0」、1日後は「1」</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">対象タスクの状態</label>
                  <select class="form-select" v-model="ruleParams.target_status">
                    <option value="NOT_STARTED">未着手</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="DELAYED">遅延</option>
                    <option value="HOLD">保留</option>
                  </select>
                </div>
              </div>

              <!-- NO_PROGRESS (進捗なし) -->
              <div v-else-if="form.rule_type === 'NO_PROGRESS'">
                <div class="mb-3">
                  <label class="form-label">進捗のない期間（日数）</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="ruleParams.days_no_progress"
                    min="1"
                    max="90"
                  />
                  <small class="text-muted">例: 7日間進捗がない場合に通知する場合は「7」</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">最小進捗率（%）</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="ruleParams.min_progress_percent"
                    min="0"
                    max="100"
                  />
                  <small class="text-muted">この進捗率以下のタスクを対象にする</small>
                </div>
              </div>

              <!-- CUSTOM (カスタム) -->
              <div v-else-if="form.rule_type === 'CUSTOM'">
                <div class="mb-3">
                  <label class="form-label">カスタムパラメータ（JSON形式）</label>
                  <textarea
                    class="form-control"
                    v-model="ruleParams.custom_json"
                    rows="5"
                    placeholder='{"key": "value"}'
                  ></textarea>
                  <small class="text-muted">JSON形式で自由にパラメータを設定できます</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 通知先メールアドレス -->
          <div class="mb-3">
            <label class="form-label">
              <i class="fa fa-envelope text-success me-1"></i>
              通知先メールアドレス <span class="text-danger">*</span>
            </label>
            <input
              type="email"
              class="form-control"
              v-model="form.notify_email"
              placeholder="example@company.com"
              :class="{ 'is-invalid': validationErrors.some(e => e.includes('メールアドレス')) }"
            />
            <small class="text-muted">アラート通知を送信するメールアドレス</small>
          </div>

          <!-- 有効/無効 -->
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="form.is_enabled"
              id="ruleEnabled"
            />
            <label class="form-check-label" for="ruleEnabled">
              <strong>このルールを有効にする</strong>
            </label>
            <small class="d-block text-muted">無効にすると通知は送信されません</small>
          </div>
        </div>
        <div class="modal-footer">
          <!-- バリデーションエラー表示 -->
          <div v-if="validationErrors.length > 0" class="text-start flex-grow-1">
            <small class="text-danger">
              <i class="fa fa-exclamation-circle me-1"></i>
              {{ validationErrors.join(' / ') }}
            </small>
          </div>
          
          <button type="button" class="btn bg-gradient-secondary" @click="onClose">
            キャンセル
          </button>
          <button
            type="button"
            class="btn bg-gradient-primary"
            :disabled="!canSave || saving"
            @click="onSave"
            :title="!canSave ? validationErrors.join(', ') : ''"
          >
            <span v-if="saving">
              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
              保存中...
            </span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- モーダルバックドロップ -->
  <div class="modal-backdrop fade show" v-if="show"></div>
</template>

<style scoped>
/* モーダルスタイル */
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  max-width: 800px;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #344767;
}

.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #344767;
}

.form-label i {
  font-size: 1rem;
}

.text-danger {
  color: #ea0606 !important;
}

/* バリデーションエラースタイル */
.is-invalid {
  border-color: #dc3545 !important;
  background-image: none;
}

.is-invalid:focus {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-footer .flex-grow-1 {
  flex-grow: 1;
}
</style>
