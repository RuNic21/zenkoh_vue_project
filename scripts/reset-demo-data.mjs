import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

/**
 * デモ用データを一括リセットし、現実的な日本向けサンプルを投入するスクリプト
 * - 指定された実ユーザー（SAFE_USER_EMAILS）は削除・更新しない
 * - それ以外の既存データを削除してから、新しいデータセットを投入
 */

const SAFE_USER_EMAILS = [
  "a.takahashi@zenkoh.com",
  "ehddnr0501@gmail.com",
  "r.shibata@zenkoh.com",
  "torikoshi2260@gmail.com"
];

const PASSWORD_PLACEHOLDER = "$2a$12$DemoShowcaseHashedValue1234567890ab1234567890ab12";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が見つかりません");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const DEMO_USERS = [
  {
    email: "k.yamamoto@zenkoh.com",
    displayName: "山本 慶介",
    firstName: "慶介",
    lastName: "山本",
    department: "事業開発本部",
    position: "DX戦略マネージャー",
    phone: "080-3123-9087",
    role: "manager",
    bio: "都市圏物流のDX推進に注力するマネージャーです。",
    skills: ["PMO", "物流DX", "PowerBI"],
    tags: ["フルタイム", "本社常駐"]
  },
  {
    email: "m.kobayashi@zenkoh.com",
    displayName: "小林 美奈",
    firstName: "美奈",
    lastName: "小林",
    department: "SCMソリューション部",
    position: "シニアアナリスト",
    phone: "080-4455-2241",
    role: "member",
    bio: "倉庫業務とデータ分析の橋渡し役です。",
    skills: ["Python", "Looker", "SCM"],
    tags: ["リモート可", "サプライチェーン"]
  },
  {
    email: "y.sato@zenkoh.com",
    displayName: "佐藤 祐太",
    firstName: "祐太",
    lastName: "佐藤",
    department: "プロダクト推進部",
    position: "テックリード",
    phone: "080-1111-7823",
    role: "manager",
    bio: "IoT 連携の設計を担うテックリードです。",
    skills: ["Vue", "TypeScript", "IoT"],
    tags: ["技術責任者"]
  },
  {
    email: "s.nakamura@zenkoh.com",
    displayName: "中村 詩織",
    firstName: "詩織",
    lastName: "中村",
    department: "デザイン＆リサーチ室",
    position: "UXリサーチャー",
    phone: "070-8765-4412",
    role: "member",
    bio: "現場観察とリモート調査を組み合わせたリサーチをリードします。",
    skills: ["UX", "インタビュー", "Figma"],
    tags: ["リサーチ", "短期出張"]
  },
  {
    email: "ayumi.tanaka@zenkoh.com",
    displayName: "田中 歩美",
    firstName: "歩美",
    lastName: "田中",
    department: "品質保証室",
    position: "QAリード",
    phone: "080-5544-9001",
    role: "member",
    bio: "自動テストと検証計画の統括を担当します。",
    skills: ["QA", "自動テスト", "Jest"],
    tags: ["品質保証"]
  },
  {
    email: "haruki.ishikawa@zenkoh.com",
    displayName: "石川 晴樹",
    firstName: "晴樹",
    lastName: "石川",
    department: "データ基盤室",
    position: "データエンジニア",
    phone: "090-6677-9834",
    role: "member",
    bio: "Snowflake と Airflow を使ったデータパイプラインを担当。",
    skills: ["Snowflake", "Airflow", "dbt"],
    tags: ["データパイプライン"]
  },
  {
    email: "naoki.kudo@zenkoh.com",
    displayName: "工藤 直樹",
    firstName: "直樹",
    lastName: "工藤",
    department: "クラウド推進室",
    position: "SRE",
    phone: "070-3322-1188",
    role: "member",
    bio: "GCP 上のインフラ安定運用とIaC整備を担当。",
    skills: ["GCP", "Terraform", "Monitoring"],
    tags: ["夜間対応"]
  },
  {
    email: "risa.ando@zenkoh.com",
    displayName: "安藤 理紗",
    firstName: "理紗",
    lastName: "安藤",
    department: "PMO室",
    position: "プロジェクトコーディネーター",
    phone: "080-9988-3344",
    role: "viewer",
    bio: "関係者調整と議事録整備を支援するPMOです。",
    skills: ["PMO", "議事録", "調整力"],
    tags: ["PMO", "ドキュメント"]
  },
  {
    email: "takeshi.watanabe@zenkoh.com",
    displayName: "渡辺 健",
    firstName: "健",
    lastName: "渡辺",
    department: "セキュリティ室",
    position: "セキュリティエンジニア",
    phone: "080-2233-4455",
    role: "member",
    bio: "クラウドセキュリティとコンプライアンス対応を担当。",
    skills: ["セキュリティ", "AWS", "コンプライアンス"],
    tags: ["セキュリティ", "コンプライアンス"]
  },
  {
    email: "yuki.morita@zenkoh.com",
    displayName: "森田 由紀",
    firstName: "由紀",
    lastName: "森田",
    department: "プロダクト推進部",
    position: "フロントエンドエンジニア",
    phone: "090-1122-3344",
    role: "member",
    bio: "Vue.js と React を使ったフロントエンド開発を担当。",
    skills: ["Vue.js", "React", "TypeScript"],
    tags: ["フロントエンド", "リモート可"]
  },
  {
    email: "hiroshi.yamada@zenkoh.com",
    displayName: "山田 博",
    firstName: "博",
    lastName: "山田",
    department: "バックエンド開発部",
    position: "バックエンドエンジニア",
    phone: "080-3344-5566",
    role: "member",
    bio: "Node.js と PostgreSQL を使ったバックエンド開発を担当。",
    skills: ["Node.js", "PostgreSQL", "REST API"],
    tags: ["バックエンド", "API設計"]
  },
  {
    email: "akiko.suzuki@zenkoh.com",
    displayName: "鈴木 明子",
    firstName: "明子",
    lastName: "鈴木",
    department: "データ分析室",
    position: "データアナリスト",
    phone: "070-4455-6677",
    role: "member",
    bio: "ビジネスデータの分析とレポート作成を担当。",
    skills: ["SQL", "Tableau", "統計分析"],
    tags: ["データ分析", "レポート"]
  },
  {
    email: "kenji.fujita@zenkoh.com",
    displayName: "藤田 健二",
    firstName: "健二",
    lastName: "藤田",
    department: "インフラ運用室",
    position: "インフラエンジニア",
    phone: "080-5566-7788",
    role: "member",
    bio: "オンプレミスとクラウドのインフラ運用を担当。",
    skills: ["Linux", "Docker", "Kubernetes"],
    tags: ["インフラ", "運用"]
  },
  {
    email: "miho.okada@zenkoh.com",
    displayName: "岡田 美穂",
    firstName: "美穂",
    lastName: "岡田",
    department: "プロジェクト管理室",
    position: "プロジェクトマネージャー",
    phone: "090-6677-8899",
    role: "manager",
    bio: "複数プロジェクトの進捗管理とリソース調整を担当。",
    skills: ["プロジェクト管理", "リソース管理", "進捗管理"],
    tags: ["PM", "マルチプロジェクト"]
  },
  {
    email: "sho.tanaka@zenkoh.com",
    displayName: "田中 翔",
    firstName: "翔",
    lastName: "田中",
    department: "モバイル開発部",
    position: "モバイルエンジニア",
    phone: "080-7788-9900",
    role: "member",
    bio: "iOS と Android アプリの開発を担当。",
    skills: ["Swift", "Kotlin", "React Native"],
    tags: ["モバイル", "アプリ開発"]
  }
];

const PROJECT_BLUEPRINTS = [
  {
    code: "tokyo-logistics-2025",
    name: "都内物流DXプログラム2025",
    description: "都内3拠点の倉庫と配送網をリアルタイム可視化し、遅延を30%削減する施策。",
    startDate: "2025-01-06",
    endDate: "2025-06-30",
    ownerEmail: "k.yamamoto@zenkoh.com",
    board: {
      name: "標準カンバン（物流DX）",
      columns: [
        { name: "未着手", wipLimit: null },
        { name: "進行中", wipLimit: 4 },
        { name: "レビュー待ち", wipLimit: 2 },
        { name: "完了", wipLimit: null }
      ]
    },
    members: [
      { email: "k.yamamoto@zenkoh.com", role: "OWNER" },
      { email: "m.kobayashi@zenkoh.com", role: "CONTRIBUTOR" },
      { email: "y.sato@zenkoh.com", role: "TECH_LEAD" },
      { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
      { email: "s.nakamura@zenkoh.com", role: "UX" },
      { email: "risa.ando@zenkoh.com", role: "COORDINATOR" },
      { email: "a.takahashi@zenkoh.com", role: "SPONSOR" }
    ],
    tasks: [
      {
        name: "倉庫在庫データ連携仕様の確定",
        description: "WMS と TMS 間で扱う SKU 属性と更新頻度、フォールバック手順を整理する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-01-08",
        plannedEnd: "2025-02-05",
        progress: 55,
        columnName: "進行中",
        assigneeEmail: "m.kobayashi@zenkoh.com",
        memberRoles: [
          { email: "m.kobayashi@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "haruki.ishikawa@zenkoh.com", role: "REVIEWER" },
          { email: "a.takahashi@zenkoh.com", role: "SPONSOR" }
        ]
      },
      {
        name: "配送リードタイム可視化ダッシュボード",
        description: "都内物流のリードタイム指標を KPI 化し、UI モックを共有する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-01-20",
        plannedEnd: "2025-02-14",
        progress: 10,
        columnName: "未着手",
        assigneeEmail: "y.sato@zenkoh.com",
        memberRoles: [
          { email: "y.sato@zenkoh.com", role: "LEAD" },
          { email: "s.nakamura@zenkoh.com", role: "REVIEWER" }
        ]
      },
      {
        name: "主要3拠点でのパイロット検証",
        description: "足立・江東・板橋拠点での実地検証とフィードバック収集を行う。",
        status: "BLOCKED",
        priority: "HIGH",
        plannedStart: "2025-02-17",
        plannedEnd: "2025-03-21",
        progress: 25,
        columnName: "レビュー待ち",
        assigneeEmail: "k.yamamoto@zenkoh.com",
        memberRoles: [
          { email: "k.yamamoto@zenkoh.com", role: "OWNER" },
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" }
        ]
      },
      {
        name: "監査用データ保持ポリシー策定",
        description: "監査部門と連携し、保持期間とマスキング手順を文書化する。",
        status: "DONE",
        priority: "LOW",
        plannedStart: "2024-12-16",
        plannedEnd: "2025-01-10",
        progress: 100,
        columnName: "完了",
        assigneeEmail: "risa.ando@zenkoh.com",
        memberRoles: [
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" },
          { email: "k.yamamoto@zenkoh.com", role: "OWNER" }
        ]
      },
      {
        name: "配送ルート最適化アルゴリズム実装",
        description: "リアルタイム交通情報を考慮した配送ルート最適化エンジンを開発する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-10",
        plannedEnd: "2025-03-15",
        progress: 40,
        columnName: "進行中",
        assigneeEmail: "y.sato@zenkoh.com",
        memberRoles: [
          { email: "y.sato@zenkoh.com", role: "LEAD" },
          { email: "hiroshi.yamada@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "m.kobayashi@zenkoh.com", role: "REVIEWER" }
        ]
      },
      {
        name: "倉庫作業員向けモバイルアプリ開発",
        description: "在庫確認とピッキング指示を表示するモバイルアプリを開発する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-03-01",
        plannedEnd: "2025-04-30",
        progress: 0,
        columnName: "未着手",
        assigneeEmail: "sho.tanaka@zenkoh.com",
        memberRoles: [
          { email: "sho.tanaka@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "s.nakamura@zenkoh.com", role: "UX" },
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" }
        ]
      },
      {
        name: "配送ドライバー向けナビゲーション統合",
        description: "既存ナビアプリと連携し、配送先情報を自動入力する機能を実装する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-03-20",
        plannedEnd: "2025-05-10",
        progress: 5,
        columnName: "未着手",
        assigneeEmail: "yuki.morita@zenkoh.com",
        memberRoles: [
          { email: "yuki.morita@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "y.sato@zenkoh.com", role: "TECH_LEAD" }
        ]
      },
      {
        name: "データ品質監視ダッシュボード",
        description: "データ連携の品質を監視し、異常を検知するダッシュボードを構築する。",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        plannedStart: "2025-01-15",
        plannedEnd: "2025-02-28",
        progress: 65,
        columnName: "進行中",
        assigneeEmail: "haruki.ishikawa@zenkoh.com",
        memberRoles: [
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
          { email: "akiko.suzuki@zenkoh.com", role: "REVIEWER" }
        ]
      },
      {
        name: "顧客向け配送状況通知システム",
        description: "顧客に配送状況をリアルタイムで通知するメール/SMSシステムを構築する。",
        status: "NOT_STARTED",
        priority: "LOW",
        plannedStart: "2025-04-01",
        plannedEnd: "2025-05-20",
        progress: 0,
        columnName: "未着手",
        assigneeEmail: "hiroshi.yamada@zenkoh.com",
        memberRoles: [
          { email: "hiroshi.yamada@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" }
        ]
      },
      {
        name: "パフォーマンステスト実施",
        description: "システム全体の負荷テストとパフォーマンス最適化を実施する。",
        status: "NOT_STARTED",
        priority: "HIGH",
        plannedStart: "2025-05-15",
        plannedEnd: "2025-06-15",
        progress: 0,
        columnName: "未着手",
        assigneeEmail: "ayumi.tanaka@zenkoh.com",
        memberRoles: [
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
          { email: "naoki.kudo@zenkoh.com", role: "SRE" }
        ]
      }
    ],
    alertRules: [
      {
        name: "期限超過アラート（物流DX）",
        ruleType: "task_overdue",
        notifyEmail: "k.yamamoto@zenkoh.com",
        createdByEmail: "k.yamamoto@zenkoh.com",
        params: { graceHours: 24, targetColumn: "進行中" }
      },
      {
        name: "進捗停滞アラート（物流DX）",
        ruleType: "progress_milestone",
        notifyEmail: "risa.ando@zenkoh.com",
        createdByEmail: "risa.ando@zenkoh.com",
        params: { progressThreshold: 40 }
      }
    ],
    notifications: [
      {
        subject: "【物流DX】在庫データ連携の仕様確認が必要です",
        body: "倉庫チームとの最終レビュー前にフィールド定義を確定してください。",
        toEmail: "m.kobayashi@zenkoh.com",
        status: "QUEUED",
        relatedTask: "倉庫在庫データ連携仕様の確定",
        relatedRule: "期限超過アラート（物流DX）",
        sendAfter: "2025-02-03T09:00:00+09:00"
      },
      {
        subject: "【物流DX】ダッシュボードUIレビュー依頼",
        body: "初期モックを共有しました。1/27 までにフィードバックをお願いします。",
        toEmail: "s.nakamura@zenkoh.com",
        status: "QUEUED",
        relatedTask: "配送リードタイム可視化ダッシュボード",
        relatedRule: "進捗停滞アラート（物流DX）",
        sendAfter: "2025-01-24T10:00:00+09:00"
      }
    ]
  },
  {
    code: "hokkaido-smart-factory",
    name: "北海道スマート工場連携基盤",
    description: "食品製造4社の IoT センサーを統合し、歩留まりと稼働率を可視化する共同基盤。",
    startDate: "2024-11-18",
    endDate: "2025-04-18",
    ownerEmail: "ehddnr0501@gmail.com",
    board: {
      name: "北海道スマート工場",
      columns: [
        { name: "要件整理", wipLimit: 5 },
        { name: "開発中", wipLimit: 4 },
        { name: "検証中", wipLimit: 3 },
        { name: "リリース準備", wipLimit: 2 }
      ]
    },
    members: [
      { email: "ehddnr0501@gmail.com", role: "OWNER" },
      { email: "y.sato@zenkoh.com", role: "TECH_LEAD" },
      { email: "s.nakamura@zenkoh.com", role: "UX" },
      { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
      { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
      { email: "torikoshi2260@gmail.com", role: "SPONSOR" }
    ],
    tasks: [
      {
        name: "センサー種別ごとのデータマッピング",
        description: "温度・振動・湿度センサーそれぞれの粒度を定義し、共通スキーマに変換する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2024-11-25",
        plannedEnd: "2024-12-20",
        progress: 60,
        columnName: "開発中",
        assigneeEmail: "haruki.ishikawa@zenkoh.com",
        memberRoles: [
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
          { email: "y.sato@zenkoh.com", role: "TECH_LEAD" },
          { email: "ehddnr0501@gmail.com", role: "OWNER" }
        ]
      },
      {
        name: "UIワイヤーフレーム共有ワークショップ",
        description: "工場責任者向けに KPI ダッシュボードのワイヤーフレームを評価してもらう。",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        plannedStart: "2025-01-07",
        plannedEnd: "2025-01-21",
        progress: 40,
        columnName: "要件整理",
        assigneeEmail: "s.nakamura@zenkoh.com",
        memberRoles: [
          { email: "s.nakamura@zenkoh.com", role: "UX" },
          { email: "ehddnr0501@gmail.com", role: "OWNER" }
        ]
      },
      {
        name: "釧路工場でのテストデプロイ",
        description: "Gateway Edge を設置し、実データでボトルネック計測を行う。",
        status: "BLOCKED",
        priority: "HIGH",
        plannedStart: "2025-02-10",
        plannedEnd: "2025-03-07",
        progress: 30,
        columnName: "検証中",
        assigneeEmail: "y.sato@zenkoh.com",
        memberRoles: [
          { email: "y.sato@zenkoh.com", role: "TECH_LEAD" },
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" }
        ]
      },
      {
        name: "稼働率アラート通知ルール設計",
        description: "ライン停止15分以内にメール通知するためのルールとテンプレートを設計する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-03-03",
        plannedEnd: "2025-03-25",
        progress: 0,
        columnName: "要件整理",
        assigneeEmail: "ayumi.tanaka@zenkoh.com",
        memberRoles: [
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
          { email: "torikoshi2260@gmail.com", role: "SPONSOR" }
        ]
      },
      {
        name: "IoTゲートウェイ機器選定と調達",
        description: "4社の工場環境に適合するIoTゲートウェイ機器を選定し、調達手続きを進める。",
        status: "DONE",
        priority: "HIGH",
        plannedStart: "2024-11-18",
        plannedEnd: "2024-12-10",
        progress: 100,
        columnName: "リリース準備",
        assigneeEmail: "ehddnr0501@gmail.com",
        memberRoles: [
          { email: "ehddnr0501@gmail.com", role: "OWNER" },
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" }
        ]
      },
      {
        name: "データストリーミングパイプライン構築",
        description: "Kafka と Flink を使ったリアルタイムデータストリーミングパイプラインを構築する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2024-12-15",
        plannedEnd: "2025-01-31",
        progress: 70,
        columnName: "開発中",
        assigneeEmail: "haruki.ishikawa@zenkoh.com",
        memberRoles: [
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
          { email: "naoki.kudo@zenkoh.com", role: "SRE" }
        ]
      },
      {
        name: "歩留まり予測モデル開発",
        description: "機械学習を使った歩留まり予測モデルを開発し、精度検証を行う。",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        plannedStart: "2025-01-10",
        plannedEnd: "2025-02-28",
        progress: 50,
        columnName: "開発中",
        assigneeEmail: "akiko.suzuki@zenkoh.com",
        memberRoles: [
          { email: "akiko.suzuki@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" }
        ]
      },
      {
        name: "工場責任者向けトレーニング資料作成",
        description: "ダッシュボードの使い方とアラート対応手順をまとめたトレーニング資料を作成する。",
        status: "NOT_STARTED",
        priority: "LOW",
        plannedStart: "2025-03-10",
        plannedEnd: "2025-03-31",
        progress: 0,
        columnName: "要件整理",
        assigneeEmail: "risa.ando@zenkoh.com",
        memberRoles: [
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" },
          { email: "s.nakamura@zenkoh.com", role: "UX" }
        ]
      },
      {
        name: "セキュリティ監査対応",
        description: "外部セキュリティ監査に対応し、脆弱性診断と修正を実施する。",
        status: "NOT_STARTED",
        priority: "HIGH",
        plannedStart: "2025-03-15",
        plannedEnd: "2025-04-10",
        progress: 0,
        columnName: "要件整理",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "ehddnr0501@gmail.com", role: "OWNER" }
        ]
      }
    ],
    alertRules: [
      {
        name: "検証期限アラート（北海道）",
        ruleType: "task_overdue",
        notifyEmail: "ehddnr0501@gmail.com",
        createdByEmail: "ehddnr0501@gmail.com",
        params: { graceHours: 12, targetColumn: "検証中" }
      },
      {
        name: "品質逸脱アラート（北海道）",
        ruleType: "qa_blocker",
        notifyEmail: "ayumi.tanaka@zenkoh.com",
        createdByEmail: "ayumi.tanaka@zenkoh.com",
        params: { allowedBugs: 5 }
      }
    ],
    notifications: [
      {
        subject: "【北海道】テストデプロイ準備状況共有",
        body: "釧路工場でのネットワーク調整が必要です。現地チームと日程を再調整してください。",
        toEmail: "ehddnr0501@gmail.com",
        status: "QUEUED",
        relatedTask: "釧路工場でのテストデプロイ",
        relatedRule: "検証期限アラート（北海道）",
        sendAfter: "2025-02-18T09:00:00+09:00"
      },
      {
        subject: "【北海道】QA観点ヒアリングのお願い",
        body: "通知テンプレートの想定シナリオを QA で整理する必要があります。",
        toEmail: "ayumi.tanaka@zenkoh.com",
        status: "QUEUED",
        relatedTask: "稼働率アラート通知ルール設計",
        relatedRule: "品質逸脱アラート（北海道）",
        sendAfter: "2025-03-05T14:00:00+09:00"
      }
    ]
  },
  {
    code: "kansai-energy-poc",
    name: "関西エネルギー可視化 POC",
    description: "関西圏の製造ラインで電力使用量と CO2 排出量を日次可視化する取り組み。",
    startDate: "2025-02-03",
    endDate: "2025-07-31",
    ownerEmail: "r.shibata@zenkoh.com",
    board: {
      name: "エネルギーPOCボード",
      columns: [
        { name: "計画中", wipLimit: 4 },
        { name: "着手中", wipLimit: 4 },
        { name: "レビュー中", wipLimit: 2 },
        { name: "完了", wipLimit: null }
      ]
    },
    members: [
      { email: "r.shibata@zenkoh.com", role: "OWNER" },
      { email: "naoki.kudo@zenkoh.com", role: "SRE" },
      { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
      { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
      { email: "s.nakamura@zenkoh.com", role: "UX" },
      { email: "k.yamamoto@zenkoh.com", role: "SPONSOR" }
    ],
    tasks: [
      {
        name: "エネルギーデータ受信基盤のIaC整備",
        description: "GCP 上で Pub/Sub と Dataflow を IaC で構築し、監視メトリクスを定義する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-05",
        plannedEnd: "2025-03-10",
        progress: 45,
        columnName: "着手中",
        assigneeEmail: "naoki.kudo@zenkoh.com",
        memberRoles: [
          { email: "naoki.kudo@zenkoh.com", role: "SRE" },
          { email: "r.shibata@zenkoh.com", role: "OWNER" }
        ]
      },
      {
        name: "CO2排出係数テーブルの確定",
        description: "排出係数のソースを整理し、パラメータをデータ基盤に登録する。",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        plannedStart: "2025-02-12",
        plannedEnd: "2025-02-28",
        progress: 35,
        columnName: "着手中",
        assigneeEmail: "haruki.ishikawa@zenkoh.com",
        memberRoles: [
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" }
        ]
      },
      {
        name: "経営層向けレポートモック作成",
        description: "経営会議で使用するダッシュボード案を3パターン提示する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-03-17",
        plannedEnd: "2025-04-04",
        progress: 0,
        columnName: "計画中",
        assigneeEmail: "s.nakamura@zenkoh.com",
        memberRoles: [
          { email: "s.nakamura@zenkoh.com", role: "UX" },
          { email: "k.yamamoto@zenkoh.com", role: "SPONSOR" }
        ]
      },
      {
        name: "CO2削減シナリオA/B比較",
        description: "エネルギー使用実績を基に削減余地を定量評価し、推奨シナリオを提示する。",
        status: "DONE",
        priority: "LOW",
        plannedStart: "2025-02-03",
        plannedEnd: "2025-02-15",
        progress: 100,
        columnName: "完了",
        assigneeEmail: "r.shibata@zenkoh.com",
        memberRoles: [
          { email: "r.shibata@zenkoh.com", role: "OWNER" },
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" }
        ]
      },
      {
        name: "スマートメーター連携API開発",
        description: "電力会社のスマートメーターAPIと連携し、リアルタイム電力データを取得する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-20",
        plannedEnd: "2025-04-10",
        progress: 30,
        columnName: "着手中",
        assigneeEmail: "hiroshi.yamada@zenkoh.com",
        memberRoles: [
          { email: "hiroshi.yamada@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "naoki.kudo@zenkoh.com", role: "SRE" }
        ]
      },
      {
        name: "異常検知アルゴリズム実装",
        description: "電力使用パターンの異常を検知する機械学習モデルを実装する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-04-15",
        plannedEnd: "2025-06-15",
        progress: 0,
        columnName: "計画中",
        assigneeEmail: "akiko.suzuki@zenkoh.com",
        memberRoles: [
          { email: "akiko.suzuki@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" }
        ]
      },
      {
        name: "データ保持ポリシーとアーカイブ設計",
        description: "長期データ保持とアーカイブ戦略を設計し、コスト最適化を図る。",
        status: "NOT_STARTED",
        priority: "LOW",
        plannedStart: "2025-05-01",
        plannedEnd: "2025-06-30",
        progress: 0,
        columnName: "計画中",
        assigneeEmail: "haruki.ishikawa@zenkoh.com",
        memberRoles: [
          { email: "haruki.ishikawa@zenkoh.com", role: "DATA_ENGINEER" },
          { email: "r.shibata@zenkoh.com", role: "OWNER" }
        ]
      },
      {
        name: "ユーザー認証と権限管理実装",
        description: "製造ラインごとのアクセス制御とロールベース権限管理を実装する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-10",
        plannedEnd: "2025-03-20",
        progress: 55,
        columnName: "着手中",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "y.sato@zenkoh.com", role: "TECH_LEAD" }
        ]
      },
      {
        name: "モバイルアプリ開発（工場責任者向け）",
        description: "工場責任者が外出先からも電力使用状況を確認できるモバイルアプリを開発する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-04-01",
        plannedEnd: "2025-06-30",
        progress: 0,
        columnName: "計画中",
        assigneeEmail: "sho.tanaka@zenkoh.com",
        memberRoles: [
          { email: "sho.tanaka@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "s.nakamura@zenkoh.com", role: "UX" }
        ]
      }
    ],
    alertRules: [
      {
        name: "電力データ未受信アラート（関西）",
        ruleType: "data_gap",
        notifyEmail: "naoki.kudo@zenkoh.com",
        createdByEmail: "naoki.kudo@zenkoh.com",
        params: { gapMinutes: 30 }
      }
    ],
    notifications: [
      {
        subject: "【関西POC】データ受信遅延の検知",
        body: "30分以上データが流れていません。現地設備のログ確認をお願いします。",
        toEmail: "naoki.kudo@zenkoh.com",
        status: "QUEUED",
        relatedTask: "エネルギーデータ受信基盤のIaC整備",
        relatedRule: "電力データ未受信アラート（関西）",
        sendAfter: "2025-02-20T08:30:00+09:00"
      },
      {
        subject: "【関西POC】経営層レビュー準備タスク",
        body: "レポートモック案のレビュー会を 3/21 に設定しました。",
        toEmail: "s.nakamura@zenkoh.com",
        status: "QUEUED",
        relatedTask: "経営層向けレポートモック作成",
        relatedRule: "電力データ未受信アラート（関西）",
        sendAfter: "2025-03-18T11:00:00+09:00"
      }
    ]
  },
  {
    code: "mobile-app-redesign",
    name: "モバイルアプリリニューアルプロジェクト",
    description: "既存モバイルアプリのUI/UXを刷新し、パフォーマンスとユーザビリティを向上させる。",
    startDate: "2025-01-15",
    endDate: "2025-05-31",
    ownerEmail: "miho.okada@zenkoh.com",
    board: {
      name: "モバイルアプリ開発ボード",
      columns: [
        { name: "バックログ", wipLimit: null },
        { name: "設計中", wipLimit: 3 },
        { name: "開発中", wipLimit: 5 },
        { name: "テスト中", wipLimit: 3 },
        { name: "リリース準備", wipLimit: 2 }
      ]
    },
    members: [
      { email: "miho.okada@zenkoh.com", role: "OWNER" },
      { email: "sho.tanaka@zenkoh.com", role: "TECH_LEAD" },
      { email: "yuki.morita@zenkoh.com", role: "CONTRIBUTOR" },
      { email: "s.nakamura@zenkoh.com", role: "UX" },
      { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
      { email: "hiroshi.yamada@zenkoh.com", role: "BACKEND" }
    ],
    tasks: [
      {
        name: "UI/UXデザインシステム構築",
        description: "新しいデザインシステムを構築し、コンポーネントライブラリを作成する。",
        status: "DONE",
        priority: "HIGH",
        plannedStart: "2025-01-15",
        plannedEnd: "2025-02-10",
        progress: 100,
        columnName: "リリース準備",
        assigneeEmail: "s.nakamura@zenkoh.com",
        memberRoles: [
          { email: "s.nakamura@zenkoh.com", role: "UX" },
          { email: "yuki.morita@zenkoh.com", role: "REVIEWER" }
        ]
      },
      {
        name: "iOSアプリリニューアル開発",
        description: "SwiftUIを使った新しいiOSアプリを開発する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-15",
        plannedEnd: "2025-04-30",
        progress: 45,
        columnName: "開発中",
        assigneeEmail: "sho.tanaka@zenkoh.com",
        memberRoles: [
          { email: "sho.tanaka@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "yuki.morita@zenkoh.com", role: "REVIEWER" }
        ]
      },
      {
        name: "Androidアプリリニューアル開発",
        description: "Jetpack Composeを使った新しいAndroidアプリを開発する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-15",
        plannedEnd: "2025-04-30",
        progress: 40,
        columnName: "開発中",
        assigneeEmail: "sho.tanaka@zenkoh.com",
        memberRoles: [
          { email: "sho.tanaka@zenkoh.com", role: "CONTRIBUTOR" },
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" }
        ]
      },
      {
        name: "バックエンドAPI改修",
        description: "モバイルアプリ向けの新しいREST APIを設計・実装する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-01",
        plannedEnd: "2025-03-31",
        progress: 60,
        columnName: "開発中",
        assigneeEmail: "hiroshi.yamada@zenkoh.com",
        memberRoles: [
          { email: "hiroshi.yamada@zenkoh.com", role: "BACKEND" },
          { email: "sho.tanaka@zenkoh.com", role: "TECH_LEAD" }
        ]
      },
      {
        name: "パフォーマンステスト実施",
        description: "アプリの起動時間、メモリ使用量、バッテリー消費を測定・最適化する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-04-15",
        plannedEnd: "2025-05-15",
        progress: 0,
        columnName: "テスト中",
        assigneeEmail: "ayumi.tanaka@zenkoh.com",
        memberRoles: [
          { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
          { email: "sho.tanaka@zenkoh.com", role: "TECH_LEAD" }
        ]
      },
      {
        name: "ユーザー受け入れテスト（UAT）",
        description: "ベータテスターを募集し、フィードバックを収集する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-05-01",
        plannedEnd: "2025-05-20",
        progress: 0,
        columnName: "テスト中",
        assigneeEmail: "s.nakamura@zenkoh.com",
        memberRoles: [
          { email: "s.nakamura@zenkoh.com", role: "UX" },
          { email: "miho.okada@zenkoh.com", role: "OWNER" }
        ]
      },
      {
        name: "App Store/Google Play申請準備",
        description: "ストア申請に必要な資料を準備し、審査申請を行う。",
        status: "NOT_STARTED",
        priority: "HIGH",
        plannedStart: "2025-05-20",
        plannedEnd: "2025-05-31",
        progress: 0,
        columnName: "リリース準備",
        assigneeEmail: "miho.okada@zenkoh.com",
        memberRoles: [
          { email: "miho.okada@zenkoh.com", role: "OWNER" },
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" }
        ]
      }
    ],
    alertRules: [
      {
        name: "開発遅延アラート（モバイル）",
        ruleType: "task_overdue",
        notifyEmail: "miho.okada@zenkoh.com",
        createdByEmail: "miho.okada@zenkoh.com",
        params: { graceHours: 48, targetColumn: "開発中" }
      },
      {
        name: "テスト失敗アラート（モバイル）",
        ruleType: "qa_blocker",
        notifyEmail: "ayumi.tanaka@zenkoh.com",
        createdByEmail: "ayumi.tanaka@zenkoh.com",
        params: { allowedBugs: 3 }
      }
    ],
    notifications: [
      {
        subject: "【モバイルアプリ】iOS開発進捗確認",
        body: "iOSアプリの開発進捗を確認してください。来週のマイルストーンに向けて調整が必要です。",
        toEmail: "miho.okada@zenkoh.com",
        status: "QUEUED",
        relatedTask: "iOSアプリリニューアル開発",
        relatedRule: "開発遅延アラート（モバイル）",
        sendAfter: "2025-03-10T10:00:00+09:00"
      }
    ]
  },
  {
    code: "security-audit-2025",
    name: "セキュリティ監査2025",
    description: "全システムのセキュリティ監査を実施し、脆弱性を特定・修正する。",
    startDate: "2025-02-01",
    endDate: "2025-06-30",
    ownerEmail: "takeshi.watanabe@zenkoh.com",
    board: {
      name: "セキュリティ監査ボード",
      columns: [
        { name: "監査対象", wipLimit: null },
        { name: "監査中", wipLimit: 5 },
        { name: "修正中", wipLimit: 8 },
        { name: "検証中", wipLimit: 3 },
        { name: "完了", wipLimit: null }
      ]
    },
    members: [
      { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" },
      { email: "naoki.kudo@zenkoh.com", role: "SRE" },
      { email: "y.sato@zenkoh.com", role: "TECH_LEAD" },
      { email: "hiroshi.yamada@zenkoh.com", role: "BACKEND" },
      { email: "ayumi.tanaka@zenkoh.com", role: "QA" },
      { email: "k.yamamoto@zenkoh.com", role: "SPONSOR" }
    ],
    tasks: [
      {
        name: "外部セキュリティ監査会社選定",
        description: "セキュリティ監査を実施する外部会社を選定し、契約を締結する。",
        status: "DONE",
        priority: "HIGH",
        plannedStart: "2025-02-01",
        plannedEnd: "2025-02-15",
        progress: 100,
        columnName: "完了",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" },
          { email: "k.yamamoto@zenkoh.com", role: "SPONSOR" }
        ]
      },
      {
        name: "脆弱性スキャン実施",
        description: "全システムに対して自動脆弱性スキャンを実施し、結果を分析する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-02-20",
        plannedEnd: "2025-03-31",
        progress: 55,
        columnName: "監査中",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" },
          { email: "naoki.kudo@zenkoh.com", role: "SRE" }
        ]
      },
      {
        name: "ペネトレーションテスト実施",
        description: "外部監査会社によるペネトレーションテストを実施する。",
        status: "IN_PROGRESS",
        priority: "HIGH",
        plannedStart: "2025-03-01",
        plannedEnd: "2025-04-15",
        progress: 40,
        columnName: "監査中",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" },
          { email: "y.sato@zenkoh.com", role: "TECH_LEAD" }
        ]
      },
      {
        name: "認証・認可システム見直し",
        description: "認証・認可システムの脆弱性を修正し、多要素認証を強化する。",
        status: "NOT_STARTED",
        priority: "HIGH",
        plannedStart: "2025-04-01",
        plannedEnd: "2025-05-15",
        progress: 0,
        columnName: "修正中",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" },
          { email: "hiroshi.yamada@zenkoh.com", role: "BACKEND" }
        ]
      },
      {
        name: "データ暗号化強化",
        description: "保存データと通信データの暗号化を強化し、鍵管理を改善する。",
        status: "NOT_STARTED",
        priority: "HIGH",
        plannedStart: "2025-04-10",
        plannedEnd: "2025-05-31",
        progress: 0,
        columnName: "修正中",
        assigneeEmail: "naoki.kudo@zenkoh.com",
        memberRoles: [
          { email: "naoki.kudo@zenkoh.com", role: "SRE" },
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" }
        ]
      },
      {
        name: "セキュリティポリシー文書化",
        description: "セキュリティポリシーと手順を文書化し、全社員に周知する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-05-15",
        plannedEnd: "2025-06-15",
        progress: 0,
        columnName: "監査対象",
        assigneeEmail: "risa.ando@zenkoh.com",
        memberRoles: [
          { email: "risa.ando@zenkoh.com", role: "COORDINATOR" },
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" }
        ]
      },
      {
        name: "監査結果レポート作成",
        description: "監査結果をまとめたレポートを作成し、経営層に報告する。",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        plannedStart: "2025-06-01",
        plannedEnd: "2025-06-30",
        progress: 0,
        columnName: "監査対象",
        assigneeEmail: "takeshi.watanabe@zenkoh.com",
        memberRoles: [
          { email: "takeshi.watanabe@zenkoh.com", role: "OWNER" },
          { email: "k.yamamoto@zenkoh.com", role: "SPONSOR" }
        ]
      }
    ],
    alertRules: [
      {
        name: "重大脆弱性検知アラート",
        ruleType: "security_critical",
        notifyEmail: "takeshi.watanabe@zenkoh.com",
        createdByEmail: "takeshi.watanabe@zenkoh.com",
        params: { severity: "critical" }
      }
    ],
    notifications: [
      {
        subject: "【セキュリティ監査】重大脆弱性の検知",
        body: "監査中に重大な脆弱性が検知されました。緊急対応が必要です。",
        toEmail: "takeshi.watanabe@zenkoh.com",
        status: "QUEUED",
        relatedTask: "脆弱性スキャン実施",
        relatedRule: "重大脆弱性検知アラート",
        sendAfter: "2025-03-15T09:00:00+09:00"
      }
    ]
  }
];

function buildJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqByEmail(list) {
  const seen = new Set();
  return list.filter((item) => {
    if (seen.has(item.email)) return false;
    seen.add(item.email);
    return true;
  });
}

// task_membersのroleをスキーマに準拠した値にマッピング
// スキーマでは 'OWNER', 'CONTRIBUTOR', 'REVIEWER' のみ許可
function mapTaskMemberRole(role) {
  const roleUpper = (role || "").toUpperCase();
  // 既に有効な値の場合はそのまま返す
  if (["OWNER", "CONTRIBUTOR", "REVIEWER"].includes(roleUpper)) {
    return roleUpper;
  }
  // リーダー系の役割は OWNER にマッピング
  if (["TECH_LEAD", "LEAD", "SPONSOR", "COORDINATOR"].includes(roleUpper)) {
    return "OWNER";
  }
  // レビュー系の役割は REVIEWER にマッピング
  if (["UX", "QA", "REVIEWER"].includes(roleUpper)) {
    return "REVIEWER";
  }
  // その他は CONTRIBUTOR にマッピング
  return "CONTRIBUTOR";
}

// alert_rulesのrule_typeをスキーマに準拠した値にマッピング
// スキーマでは 'DUE_SOON', 'OVERDUE', 'NO_PROGRESS', 'CUSTOM' のみ許可
function mapAlertRuleType(ruleType) {
  const typeUpper = (ruleType || "").toUpperCase();
  // 既に有効な値の場合はそのまま返す
  if (["DUE_SOON", "OVERDUE", "NO_PROGRESS", "CUSTOM"].includes(typeUpper)) {
    return typeUpper;
  }
  // task_overdue は OVERDUE にマッピング
  if (typeUpper === "TASK_OVERDUE") {
    return "OVERDUE";
  }
  // progress_milestone, qa_blocker は NO_PROGRESS にマッピング
  if (["PROGRESS_MILESTONE", "QA_BLOCKER"].includes(typeUpper)) {
    return "NO_PROGRESS";
  }
  // その他は CUSTOM にマッピング
  return "CUSTOM";
}

function buildDeleteQuery(table) {
  if (table === "task_members") {
    return supabase.from(table).delete().gte("task_id", 0);
  }
  if (table === "project_members") {
    return supabase.from(table).delete().gte("project_id", 0);
  }
  return supabase.from(table).delete().neq("id", 0);
}

async function clearRelationshipTables() {
  console.log("=== 既存データ削除を開始します ===");
  const tables = [
    "notifications",
    "task_members",
    "alert_rules",
    "board_columns",
    "boards",
    "tasks",
    "project_members",
    "projects"
  ];
  for (const table of tables) {
    console.log(`[削除中] ${table}`);
    const { error } = await buildDeleteQuery(table);
    if (error) {
      throw new Error(`${table} の削除に失敗: ${error.message}`);
    }
    console.log(`[完了] ${table}`);
  }
  console.log("=== リレーション系テーブルの削除が完了しました ===");
}

async function clearDemoUsers() {
  const safeList = SAFE_USER_EMAILS.map((email) => `"${email}"`).join(",");
  const { data, error } = await supabase
    .from("users")
    .select("id,email")
    .not("email", "in", `(${safeList})`);
  if (error) {
    throw new Error(`ユーザーフェッチに失敗: ${error.message}`);
  }
  if (!data || data.length === 0) {
    console.log("削除対象のユーザーはありません（実ユーザーのみ存在）。");
    return;
  }
  const ids = data.map((u) => u.id);
  console.log(`[削除中] デモユーザー ${ids.length} 件`);
  const { error: deleteError } = await supabase.from("users").delete().in("id", ids);
  if (deleteError) {
    throw new Error(`デモユーザー削除に失敗: ${deleteError.message}`);
  }
  console.log("[完了] デモユーザーを削除しました");
}

async function fetchSafeUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id,email,display_name")
    .in("email", SAFE_USER_EMAILS);
  if (error) {
    throw new Error(`実ユーザー取得に失敗: ${error.message}`);
  }
  const missing = SAFE_USER_EMAILS.filter(
    (email) => !data?.some((row) => row.email === email)
  );
  if (missing.length > 0) {
    throw new Error(`以下の実ユーザーが見つかりません: ${missing.join(", ")}`);
  }
  return data;
}

// usersテーブルにroleカラムが存在するか確認
async function checkRoleColumnExists() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .limit(1);
    // エラーが発生した場合、roleカラムが存在しない可能性が高い
    return !error && data !== null;
  } catch {
    return false;
  }
}

async function seedDemoUsers() {
  console.log("=== デモユーザーを投入します ===");
  if (DEMO_USERS.length === 0) return [];
  
  // roleカラムの存在を確認
  const hasRoleColumn = await checkRoleColumnExists();
  
  const payload = DEMO_USERS.map((user) => {
    const basePayload = {
      email: user.email,
      display_name: user.displayName,
      first_name: user.firstName,
      last_name: user.lastName,
      department: user.department,
      position: user.position,
      phone: user.phone,
      password_hash: PASSWORD_PLACEHOLDER,
      is_active: true,
      timezone: "Asia/Tokyo",
      language: "ja",
      work_hours_start: "09:00",
      work_hours_end: "18:00",
      bio: user.bio,
      skills: buildJsonValue(user.skills),
      tags: buildJsonValue(user.tags)
    };
    // roleカラムが存在する場合のみ追加
    if (hasRoleColumn) {
      basePayload.role = user.role;
    }
    return basePayload;
  });
  
  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select("id,email,display_name");
  if (error) {
    throw new Error(`デモユーザー投入に失敗: ${error.message}`);
  }
  console.log(`[完了] デモユーザー ${data.length} 件を作成`);
  return data;
}

function ensureUser(userMap, email, context) {
  const user = userMap.get(email);
  if (!user) {
    throw new Error(`[${context}] ユーザーが存在しません: ${email}`);
  }
  return user;
}

function toIso(dateStr, time = "09:00") {
  if (!dateStr) return null;
  return `${dateStr}T${time}:00+09:00`;
}

async function seedProject(projectBlueprint, userMap) {
  const owner = ensureUser(userMap, projectBlueprint.ownerEmail, projectBlueprint.code);
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert([
      {
        name: projectBlueprint.name,
        description: projectBlueprint.description,
        start_date: projectBlueprint.startDate,
        end_date: projectBlueprint.endDate,
        owner_user_id: owner.id,
        is_archived: false
      }
    ])
    .select("*")
    .single();
  if (projectError) {
    throw new Error(`${projectBlueprint.code} のプロジェクト作成に失敗: ${projectError.message}`);
  }

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert([
      {
        project_id: project.id,
        name: projectBlueprint.board.name,
        is_default: true
      }
    ])
    .select("*")
    .single();
  if (boardError) {
    throw new Error(`${projectBlueprint.code} のボード作成に失敗: ${boardError.message}`);
  }

  const columnPayload = projectBlueprint.board.columns.map((col, idx) => ({
    board_id: board.id,
    name: col.name,
    sort_order: idx + 1,
    wip_limit: col.wipLimit ?? null
  }));
  const { data: columns, error: columnError } = await supabase
    .from("board_columns")
    .insert(columnPayload)
    .select("*");
  if (columnError) {
    throw new Error(`${projectBlueprint.code} のカラム作成に失敗: ${columnError.message}`);
  }
  const columnMap = new Map(columns.map((col) => [col.name, col.id]));

  const members = uniqByEmail(projectBlueprint.members);
  if (members.length > 0) {
    const memberPayload = members.map((member) => {
      const user = ensureUser(userMap, member.email, `${projectBlueprint.code} project_members`);
      return {
        project_id: project.id,
        user_id: user.id,
        role: member.role
      };
    });
    const { error: memberError } = await supabase.from("project_members").insert(memberPayload);
    if (memberError) {
      throw new Error(`${projectBlueprint.code} のプロジェクトメンバー投入に失敗: ${memberError.message}`);
    }
  }

  const taskPayload = projectBlueprint.tasks.map((task, index) => {
    const assignee = ensureUser(
      userMap,
      task.assigneeEmail,
      `${projectBlueprint.code} tasks`
    );
    const currentColumnId = columnMap.get(task.columnName) ?? null;
    return {
      project_id: project.id,
      task_name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      planned_start: toIso(task.plannedStart, "09:00"),
      planned_end: toIso(task.plannedEnd, "18:00"),
      progress_percent: task.progress,
      primary_assignee_id: assignee.id,
      current_column_id: currentColumnId,
      sort_order: index + 1,
      is_archived: false
    };
  });
  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .insert(taskPayload)
    .select("*");
  if (taskError) {
    throw new Error(`${projectBlueprint.code} のタスク投入に失敗: ${taskError.message}`);
  }
  const taskMap = new Map(tasks.map((task) => [task.task_name, task]));

  const taskMemberRows = [];
  for (const taskBlueprint of projectBlueprint.tasks) {
    const taskRow = taskMap.get(taskBlueprint.name);
    if (!taskRow) continue;
    const membersForTask = uniqByEmail(taskBlueprint.memberRoles || []);
    for (const member of membersForTask) {
      const user = ensureUser(
        userMap,
        member.email,
        `${projectBlueprint.code} task_members`
      );
      taskMemberRows.push({
        task_id: taskRow.id,
        user_id: user.id,
        role: mapTaskMemberRole(member.role)
      });
    }
  }
  if (taskMemberRows.length > 0) {
    const { error: tmError } = await supabase.from("task_members").insert(taskMemberRows);
    if (tmError) {
      throw new Error(`${projectBlueprint.code} のタスクメンバー投入に失敗: ${tmError.message}`);
    }
  }

  const alertPayload = (projectBlueprint.alertRules || []).map((rule) => {
    const creator = rule.createdByEmail
      ? ensureUser(userMap, rule.createdByEmail, `${projectBlueprint.code} alert_rules`)
      : owner;
    return {
      project_id: project.id,
      name: rule.name,
      rule_type: mapAlertRuleType(rule.ruleType),
      notify_email: rule.notifyEmail,
      params_json: buildJsonValue(rule.params ?? {}),
      is_enabled: true,
      created_by: creator.id,
      updated_by: creator.id
    };
  });
  let alertMap = new Map();
  if (alertPayload.length > 0) {
    const { data: alerts, error: alertError } = await supabase
      .from("alert_rules")
      .insert(alertPayload)
      .select("*");
    if (alertError) {
      throw new Error(`${projectBlueprint.code} のアラートルール投入に失敗: ${alertError.message}`);
    }
    alertMap = new Map(alerts.map((row) => [row.name, row]));
  }

  const notificationPayload = (projectBlueprint.notifications || []).map((notice) => {
    const taskRow = notice.relatedTask ? taskMap.get(notice.relatedTask) : null;
    const ruleRow = notice.relatedRule ? alertMap.get(notice.relatedRule) : null;
    return {
      project_id: project.id,
      task_id: taskRow?.id ?? null,
      alert_rule_id: ruleRow?.id ?? null,
      to_email: notice.toEmail,
      subject: notice.subject,
      body_text: notice.body,
      status: notice.status || "QUEUED",
      send_after: notice.sendAfter,
      retry_count: 0
    };
  });
  if (notificationPayload.length > 0) {
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notificationPayload);
    if (notificationError) {
      throw new Error(`${projectBlueprint.code} の通知投入に失敗: ${notificationError.message}`);
    }
  }

  console.log(`[完了] ${projectBlueprint.name} を投入しました`);
}

async function main() {
  try {
    await clearRelationshipTables();
    await clearDemoUsers();
    const safeUsers = await fetchSafeUsers();
    const demoUsers = await seedDemoUsers();
    const userMap = new Map([...safeUsers, ...demoUsers].map((user) => [user.email, user]));
    for (const blueprint of PROJECT_BLUEPRINTS) {
      await seedProject(blueprint, userMap);
    }
    console.log("=== デモデータの投入が完了しました ===");
  } catch (error) {
    console.error("デモデータ投入でエラーが発生しました:", error.message || error);
    process.exit(1);
  }
}

main();

