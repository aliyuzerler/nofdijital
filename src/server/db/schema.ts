import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

/* ---- Enums ---- */
export const userRoleEnum = pgEnum("user_role", ["owner", "editor"]);
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "scheduled",
  "published",
  "archived",
]);
export const contactStatusEnum = pgEnum("contact_status", ["new", "read", "archived"]);
export const pageStatusEnum = pgEnum("page_status", ["draft", "published"]);

const ts = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ---- Auth: Better Auth tabloları ---- */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("editor"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---- Site ---- */
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  valueJson: jsonb("value_json").notNull(),
  updatedBy: text("updated_by"),
  ...ts,
});

export const navigationItems = pgTable("navigation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  target: varchar("target", { length: 16 }).notNull().default("_self"),
  ...ts,
});

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    originalFilename: text("original_filename").notNull(),
    storedFilename: text("stored_filename").notNull(),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text"),
    title: text("title"),
    caption: text("caption"),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("media_checksum_idx").on(t.checksumSha256), index("media_created_idx").on(t.createdAt)],
);

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  status: pageStatusEnum("status").notNull().default("published"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  canonicalUrl: text("canonical_url"),
  ogImageId: uuid("og_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...ts,
});

export const pageSections = pgTable(
  "page_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    sectionKey: varchar("section_key", { length: 48 }).notNull(),
    sectionType: varchar("section_type", { length: 48 }).notNull(),
    title: text("title"),
    eyebrow: text("eyebrow"),
    bodyJson: jsonb("body_json").notNull().default({}),
    settingsJson: jsonb("settings_json").notNull().default({}),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    ...ts,
  },
  (t) => [uniqueIndex("page_sections_page_key_idx").on(t.pageId, t.sectionKey)],
);

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  iconKey: varchar("icon_key", { length: 32 }).notNull(),
  styleVariant: varchar("style_variant", { length: 16 }).notNull().default(""),
  spanClass: varchar("span_class", { length: 8 }).notNull().default("c4"),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...ts,
});

export const processSteps = pgTable("process_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  ...ts,
});

export const portfolioProjects = pgTable("portfolio_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 64 }),
  coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  position: integer("position").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isVisible: boolean("is_visible").notNull().default(true),
  ...ts,
});

export const portfolioImages = pgTable(
  "portfolio_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => portfolioProjects.id, { onDelete: "cascade" }),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    caption: text("caption"),
    altText: text("alt_text").notNull(),
    position: integer("position").notNull().default(0),
    aspectRatio: varchar("aspect_ratio", { length: 16 }),
    cropPosition: varchar("crop_position", { length: 16 }).notNull().default("center"),
    isVisible: boolean("is_visible").notNull().default(true),
    ...ts,
  },
  (t) => [index("portfolio_images_pos_idx").on(t.position)],
);

export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  ...ts,
});

export const blogTags = pgTable("blog_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...ts,
});

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => blogTags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    bodyJson: jsonb("body_json").notNull(),
    bodyHtmlCache: text("body_html_cache"),
    categoryId: uuid("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    readingMinutes: integer("reading_minutes").notNull().default(5),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    ogImageId: uuid("og_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    robotsIndex: boolean("robots_index").notNull().default(true),
    robotsFollow: boolean("robots_follow").notNull().default(true),
    revisionNumber: integer("revision_number").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("blog_posts_status_pub_idx").on(t.status, t.publishedAt),
    index("blog_posts_cat_idx").on(t.categoryId, t.status, t.publishedAt),
    index("blog_posts_created_idx").on(t.createdAt),
  ],
);

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  status: contactStatusEnum("status").notNull().default("new"),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgentSummary: text("user_agent_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contentRevisions = pgTable("content_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 48 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  snapshotJson: jsonb("snapshot_json").notNull(),
  revisionNumber: integer("revision_number").notNull().default(1),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id"),
  actorEmail: text("actor_email"),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 48 }).notNull(),
  entityId: text("entity_id"),
  metadataJson: jsonb("metadata_json").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const urlRedirects = pgTable("url_redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* Tipler */
export type BlogPost = typeof blogPosts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ProcessStep = typeof processSteps.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type PageSection = typeof pageSections.$inferSelect;
