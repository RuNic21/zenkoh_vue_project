// 自動生成型に合わせた各テーブルのCRUDサービスを作成
import { createCrudRepo } from "./crud";

import type { Projects, ProjectsInsert, ProjectsUpdate } from "../types/db/projects";
import type { Tasks, TasksInsert, TasksUpdate } from "../types/db/tasks";
import type { Users, UsersInsert, UsersUpdate } from "../types/db/users";
import type { Boards, BoardsInsert, BoardsUpdate } from "../types/db/boards";
import type { BoardColumns, BoardColumnsInsert, BoardColumnsUpdate } from "../types/db/board_columns";
import type { TaskMembers, TaskMembersInsert, TaskMembersUpdate } from "../types/db/task_members";
import type { AlertRules, AlertRulesInsert, AlertRulesUpdate } from "../types/db/alert_rules";
import type { Notifications, NotificationsInsert, NotificationsUpdate } from "../types/db/notifications";

export const projectsRepo = createCrudRepo<Projects, ProjectsInsert, ProjectsUpdate>("projects");
export const tasksRepo = createCrudRepo<Tasks, TasksInsert, TasksUpdate>("tasks");
export const usersRepo = createCrudRepo<Users, UsersInsert, UsersUpdate>("users");
export const boardsRepo = createCrudRepo<Boards, BoardsInsert, BoardsUpdate>("boards");
export const boardColumnsRepo = createCrudRepo<BoardColumns, BoardColumnsInsert, BoardColumnsUpdate>("board_columns");
export const taskMembersRepo = createCrudRepo<TaskMembers, TaskMembersInsert, TaskMembersUpdate>("task_members");
export const alertRulesRepo = createCrudRepo<AlertRules, AlertRulesInsert, AlertRulesUpdate>("alert_rules");
export const notificationsRepo = createCrudRepo<Notifications, NotificationsInsert, NotificationsUpdate>("notifications");


