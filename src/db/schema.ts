/**
 * 🔒 Source of truth for all data shapes (docs/04-architecture.md §4).
 * TS keys are camelCase; columns become snake_case via `casing: "snake_case"`.
 * Change the schema only through migrations: `pnpm db:generate` → `pnpm db:migrate`.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const userRole = pgEnum("user_role", ["owner", "admin", "member"]);
export const userStatus = pgEnum("user_status", ["active", "paused", "left"]);

/* ---------- Auth (shape required by Better Auth + username/admin plugins) ---------- */

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  // Better Auth requires an email; we store a synthetic one (<username>@qpteam.local).
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  username: text().unique(),
  displayUsername: text(),
  role: userRole().notNull().default("member"),
  banned: boolean().default(false),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true }),
  // Project fields
  phone: text(),
  status: userStatus().notNull().default("active"),
  joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  mustChangePassword: boolean().notNull().default(true),
  adminNote: text(),
  lastSeenAt: timestamp({ withTimezone: true }),
  deletedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    impersonatedBy: text(),
    ...timestamps,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* ---------- Project tables ---------- */

export const tiktokChannels = pgTable(
  "tiktok_channels",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    username: text().notNull(),
    url: text().notNull(),
    isPrimary: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("tiktok_channels_user_id_idx").on(t.userId),
    uniqueIndex("tiktok_channels_user_username_uq").on(t.userId, t.username),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    targetType: text().notNull(),
    targetId: text().notNull(),
    meta: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

export const downloadKind = pgEnum("download_kind", ["video", "audio", "image"]);
export const downloadStatus = pgEnum("download_status", ["ok", "failed"]);

export const downloads = pgTable(
  "downloads",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceUrl: text().notNull(),
    kind: downloadKind().notNull(),
    title: text().notNull().default(""),
    author: text().notNull().default(""),
    status: downloadStatus().notNull(),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("downloads_user_created_idx").on(t.userId, t.createdAt),
    index("downloads_created_idx").on(t.createdAt),
  ],
);

/* ---------- Skill library (Sprint 3) & learning path (Sprint 4) ---------- */

export const fileKind = pgEnum("file_kind", ["image", "video", "document"]);
export const skillStatus = pgEnum("skill_status", ["draft", "published"]);
export const skillDifficulty = pgEnum("skill_difficulty", ["basic", "intermediate", "advanced"]);
export const skillVideoKind = pgEnum("skill_video_kind", ["upload", "embed"]);
export const learningStatus = pgEnum("learning_status", ["saved", "completed"]);

export const files = pgTable(
  "files",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: fileKind().notNull(),
    mime: text().notNull(),
    sizeBytes: integer().notNull(),
    storageKey: text().notNull().unique(),
    originalName: text().notNull(),
    uploadedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("files_uploaded_by_idx").on(t.uploadedBy)],
);

export const levels = pgTable("levels", {
  id: uuid().primaryKey().defaultRandom(),
  number: integer().notNull().unique(),
  name: text().notNull(),
  description: text().notNull().default(""),
  sortOrder: integer().notNull().default(0),
  ...timestamps,
});

export const skills = pgTable(
  "skills",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull().default(""),
    coverFileId: uuid().references(() => files.id, { onDelete: "set null" }),
    videoKind: skillVideoKind(),
    videoFileId: uuid().references(() => files.id, { onDelete: "set null" }),
    videoEmbedUrl: text(),
    difficulty: skillDifficulty().notNull().default("basic"),
    durationMin: integer().notNull().default(0),
    levelId: uuid().references(() => levels.id, { onDelete: "set null" }),
    isRequired: boolean().notNull().default(false),
    capcutTemplateUrl: text(),
    tags: text().array().notNull().default([]),
    status: skillStatus().notNull().default("draft"),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp({ withTimezone: true }),
    deletedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("skills_status_idx").on(t.status), index("skills_level_idx").on(t.levelId)],
);

export const skillSteps = pgTable(
  "skill_steps",
  {
    id: uuid().primaryKey().defaultRandom(),
    skillId: uuid()
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    title: text().notNull(),
    body: text().notNull().default(""),
    mediaFileId: uuid().references(() => files.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("skill_steps_skill_idx").on(t.skillId, t.position)],
);

export const skillAttachments = pgTable(
  "skill_attachments",
  {
    id: uuid().primaryKey().defaultRandom(),
    skillId: uuid()
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    fileId: uuid()
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    label: text().notNull(),
    ...timestamps,
  },
  (t) => [index("skill_attachments_skill_idx").on(t.skillId)],
);

export const learningProgress = pgTable(
  "learning_progress",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: uuid()
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    status: learningStatus().notNull(),
    completedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
);

/* ---------- Trend radar (Sprint 5) ---------- */

export const trendType = pgEnum("trend_type", ["capcut_edit", "sound"]);
export const trendStatus = pgEnum("trend_status", ["pending", "published", "rejected"]);

export const trendItems = pgTable(
  "trend_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: trendType().notNull(),
    source: text().notNull(),
    url: text().notNull().unique(),
    title: text().notNull().default(""),
    coverUrl: text(),
    author: text().notNull().default(""),
    soundName: text(),
    viewCount: integer(),
    useCount: integer(),
    heatScore: integer().notNull().default(0),
    status: trendStatus().notNull().default("pending"),
    isPinned: boolean().notNull().default(false),
    note: text().notNull().default(""),
    skillId: uuid().references(() => skills.id, { onDelete: "set null" }),
    addedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    firstSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("trend_items_type_status_idx").on(t.type, t.status, t.firstSeenAt)],
);

export const trendSnapshots = pgTable(
  "trend_snapshots",
  {
    id: uuid().primaryKey().defaultRandom(),
    trendId: uuid()
      .notNull()
      .references(() => trendItems.id, { onDelete: "cascade" }),
    viewCount: integer(),
    useCount: integer(),
    capturedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trend_snapshots_trend_idx").on(t.trendId, t.capturedAt)],
);

export const trendRuns = pgTable("trend_runs", {
  id: uuid().primaryKey().defaultRandom(),
  source: text().notNull(),
  startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp({ withTimezone: true }),
  ok: boolean().notNull().default(false),
  foundCount: integer().notNull().default(0),
  newCount: integer().notNull().default(0),
  error: text(),
});

export const savedTrends = pgTable(
  "saved_trends",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trendId: uuid()
      .notNull()
      .references(() => trendItems.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.trendId] })],
);

/* ---------- Notifications & settings (Sprint 6) ---------- */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull().default(""),
    link: text(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_created_idx").on(t.userId, t.createdAt)],
);

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  ...timestamps,
});

export type UserRole = (typeof userRole.enumValues)[number];
export type UserStatus = (typeof userStatus.enumValues)[number];
