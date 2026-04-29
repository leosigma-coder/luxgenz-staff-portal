import { createClient, type Client } from "@libsql/client";
import bcryptjs from "bcryptjs";

let db: Client;
let initialized = false;

function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL || "file:staff.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;
    db = createClient({ url, authToken });
  }
  return db;
}

async function ensureInit(): Promise<Client> {
  const client = getDb();
  if (!initialized) {
    await initDb(client);
    initialized = true;
  }
  return client;
}

export const STAFF_ROLES = [
  { value: "owner", label: "Owner", level: "owner", color: "amber" },
  { value: "executive", label: "Executive", level: "admin", color: "purple" },
  { value: "management", label: "Management", level: "admin", color: "purple" },
  { value: "staff_management", label: "Staff Management", level: "admin", color: "blue" },
  { value: "developer", label: "Developer", level: "admin", color: "red" },
  { value: "administrator", label: "Administrator", level: "admin", color: "red" },
  { value: "builder", label: "Builder", level: "staff", color: "pink" },
  { value: "sr_mod", label: "Sr Mod", level: "staff", color: "cyan" },
  { value: "mod", label: "Mod", level: "staff", color: "cyan" },
  { value: "jr_mod", label: "Jr Mod", level: "staff", color: "teal" },
  { value: "helper", label: "Helper", level: "staff", color: "green" },
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number]["value"];

export function getStaffRoleInfo(role: string) {
  return STAFF_ROLES.find((r) => r.value === role);
}

export function getAuthLevel(staffRole: string): "owner" | "admin" | "staff" {
  const info = getStaffRoleInfo(staffRole);
  return (info?.level as "owner" | "admin" | "staff") || "staff";
}

export const EVENT_TYPES = [
  { value: "general", label: "General" },
  { value: "tournament", label: "Tournament" },
  { value: "meeting", label: "Meeting" },
  { value: "training", label: "Training" },
  { value: "maintenance", label: "Maintenance" },
] as const;

async function initDb(client: Client) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'staff')),
      staff_role TEXT NOT NULL DEFAULT 'helper',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_password_reset TEXT,
      last_login TEXT,
      bio TEXT
    );

    CREATE TABLE IF NOT EXISTS updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      priority TEXT NOT NULL DEFAULT 'normal',
      version TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      author TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT,
      event_type TEXT NOT NULL DEFAULT 'general',
      author TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('attending', 'not_attending')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      priority TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'published',
      author TEXT NOT NULL,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'todo',
      assigned_to INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target TEXT,
      performed_by TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS server_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      online_players INTEGER NOT NULL DEFAULT 0,
      max_players INTEGER NOT NULL DEFAULT 0,
      tps REAL NOT NULL DEFAULT 20.0,
      online_staff TEXT,
      staff_in_modmode TEXT,
      staff_vanished TEXT,
      frozen_players TEXT,
      panic_mode INTEGER NOT NULL DEFAULT 0,
      chat_enabled INTEGER NOT NULL DEFAULT 1,
      uptime_seconds INTEGER NOT NULL DEFAULT 0,
      server_version TEXT,
      last_heartbeat TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plugin_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT,
      target TEXT,
      reason TEXT,
      duration TEXT,
      metadata TEXT,
      server TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mc_punishments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      punishment_type TEXT NOT NULL,
      player TEXT NOT NULL,
      player_uuid TEXT,
      issued_by TEXT NOT NULL,
      reason TEXT,
      duration TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS mc_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter TEXT NOT NULL,
      target TEXT NOT NULL,
      reason TEXT NOT NULL,
      server TEXT,
      world TEXT,
      handled INTEGER NOT NULL DEFAULT 0,
      handled_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mc_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT UNIQUE NOT NULL,
      player TEXT NOT NULL,
      player_uuid TEXT,
      offense TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      assigned_to TEXT,
      notes TEXT,
      evidence TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mc_staff_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      mc_uuid TEXT,
      total_punishments INTEGER NOT NULL DEFAULT 0,
      warnings_issued INTEGER NOT NULL DEFAULT 0,
      mutes_issued INTEGER NOT NULL DEFAULT 0,
      bans_issued INTEGER NOT NULL DEFAULT 0,
      kicks_issued INTEGER NOT NULL DEFAULT 0,
      reports_handled INTEGER NOT NULL DEFAULT 0,
      modmode_time_mins INTEGER NOT NULL DEFAULT 0,
      playtime_mins INTEGER NOT NULL DEFAULT 0,
      last_online TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const owner = await client.execute("SELECT id FROM users WHERE role = 'owner'");
  if (owner.rows.length === 0) {
    const hash = bcryptjs.hashSync("R3bound", 10);
    await client.execute({
      sql: "INSERT INTO users (username, password_hash, role, staff_role) VALUES (?, ?, ?, ?)",
      args: ["Luxgenz", hash, "owner", "owner"],
    });
  }
}

// --- Helper to convert row to plain object ---
function rowToObj<T>(row: Record<string, unknown>): T {
  return { ...row } as T;
}
function rowsToArr<T>(rows: Array<Record<string, unknown>>): T[] {
  return rows.map((r) => ({ ...r }) as T);
}

// --- Users ---

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: "owner" | "admin" | "staff";
  staff_role: StaffRole;
  created_by: string | null;
  created_at: string;
  last_password_reset: string | null;
  last_login: string | null;
  bio: string | null;
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT * FROM users WHERE username = ?", args: [username] });
  if (result.rows.length === 0) return null;
  const user = rowToObj<User>(result.rows[0] as unknown as Record<string, unknown>);
  if (!bcryptjs.compareSync(password, user.password_hash)) return null;
  return user;
}

export async function createUser(
  username: string,
  password: string,
  staffRole: StaffRole,
  createdBy: string
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  const db = await ensureInit();
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
  if (existing.rows.length > 0) {
    return { success: false, error: "Username already exists" };
  }
  const authLevel = getAuthLevel(staffRole);
  const hash = bcryptjs.hashSync(password, 10);
  await db.execute({
    sql: "INSERT INTO users (username, password_hash, role, staff_role, created_by) VALUES (?, ?, ?, ?, ?)",
    args: [username, hash, authLevel, staffRole, createdBy],
  });
  return { success: true, tempPassword: password };
}

export async function getAllUsers(): Promise<Omit<User, "password_hash">[]> {
  const db = await ensureInit();
  const result = await db.execute("SELECT id, username, role, staff_role, created_by, created_at, last_password_reset, last_login, bio FROM users ORDER BY created_at DESC");
  return rowsToArr<Omit<User, "password_hash">>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getUserById(id: number): Promise<Omit<User, "password_hash"> | undefined> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT id, username, role, staff_role, created_by, created_at, last_password_reset, last_login, bio FROM users WHERE id = ?", args: [id] });
  if (result.rows.length === 0) return undefined;
  return rowToObj<Omit<User, "password_hash">>(result.rows[0] as unknown as Record<string, unknown>);
}

export async function updateLastLogin(userId: number) {
  const db = await ensureInit();
  await db.execute({ sql: "UPDATE users SET last_login = datetime('now') WHERE id = ?", args: [userId] });
}

export async function updateBio(userId: number, bio: string) {
  const db = await ensureInit();
  await db.execute({ sql: "UPDATE users SET bio = ? WHERE id = ?", args: [bio, userId] });
}

export async function updateStaffRole(
  userId: number,
  staffRole: StaffRole
): Promise<{ success: boolean; error?: string }> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT role FROM users WHERE id = ?", args: [userId] });
  if (result.rows.length === 0) return { success: false, error: "User not found" };
  const user = result.rows[0] as unknown as { role: string };
  if (user.role === "owner") return { success: false, error: "Cannot change the owner role" };
  const authLevel = getAuthLevel(staffRole);
  await db.execute({ sql: "UPDATE users SET staff_role = ?, role = ? WHERE id = ?", args: [staffRole, authLevel, userId] });
  return { success: true };
}

export async function deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT role FROM users WHERE id = ?", args: [userId] });
  if (result.rows.length === 0) return { success: false, error: "User not found" };
  const user = result.rows[0] as unknown as { role: string };
  if (user.role === "owner") return { success: false, error: "Cannot delete the owner account" };
  await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [userId] });
  return { success: true };
}

export async function resetPassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT role FROM users WHERE id = ?", args: [userId] });
  if (result.rows.length === 0) return { success: false, error: "User not found" };
  const hash = bcryptjs.hashSync(newPassword, 10);
  await db.execute({ sql: "UPDATE users SET password_hash = ?, last_password_reset = datetime('now') WHERE id = ?", args: [hash, userId] });
  return { success: true };
}

export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- Updates ---

export interface Update {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  version: string | null;
  status: string;
  author: string;
  created_at: string;
}

export async function createUpdate(
  title: string,
  content: string,
  category: string,
  priority: string,
  version: string | null,
  author: string,
  status: string = "published"
) {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO updates (title, content, category, priority, version, author, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [title, content, category, priority, version, author, status],
  });
  return { success: true };
}

export async function getAllUpdates(includeDrafts = false): Promise<Update[]> {
  const db = await ensureInit();
  if (includeDrafts) {
    const result = await db.execute("SELECT * FROM updates ORDER BY created_at DESC");
    return rowsToArr<Update>(result.rows as unknown as Record<string, unknown>[]);
  }
  const result = await db.execute("SELECT * FROM updates WHERE status = 'published' ORDER BY created_at DESC");
  return rowsToArr<Update>(result.rows as unknown as Record<string, unknown>[]);
}

export async function publishUpdate(id: number) {
  const db = await ensureInit();
  await db.execute({ sql: "UPDATE updates SET status = 'published' WHERE id = ?", args: [id] });
  return { success: true };
}

export async function deleteUpdate(id: number) {
  const db = await ensureInit();
  await db.execute({ sql: "DELETE FROM updates WHERE id = ?", args: [id] });
  return { success: true };
}

// --- Events ---

export interface StaffEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  author: string;
  created_at: string;
}

export interface EventRsvp {
  id: number;
  event_id: number;
  user_id: number;
  status: "attending" | "not_attending";
}

export async function createEvent(
  title: string,
  description: string,
  eventDate: string,
  eventTime: string | null,
  eventType: string,
  author: string
) {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO events (title, description, event_date, event_time, event_type, author) VALUES (?, ?, ?, ?, ?, ?)",
    args: [title, description, eventDate, eventTime, eventType, author],
  });
  return { success: true };
}

export async function getAllEvents(): Promise<StaffEvent[]> {
  const db = await ensureInit();
  const result = await db.execute("SELECT * FROM events ORDER BY event_date ASC");
  return rowsToArr<StaffEvent>(result.rows as unknown as Record<string, unknown>[]);
}

export async function deleteEvent(id: number) {
  const db = await ensureInit();
  await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [id] });
  return { success: true };
}

export async function setRsvp(eventId: number, userId: number, status: "attending" | "not_attending") {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?) ON CONFLICT(event_id, user_id) DO UPDATE SET status = ?",
    args: [eventId, userId, status, status],
  });
  return { success: true };
}

export async function getRsvpsForEvent(eventId: number): Promise<(EventRsvp & { username: string })[]> {
  const db = await ensureInit();
  const result = await db.execute({
    sql: "SELECT r.*, u.username FROM event_rsvps r JOIN users u ON r.user_id = u.id WHERE r.event_id = ?",
    args: [eventId],
  });
  return rowsToArr<EventRsvp & { username: string }>(result.rows as unknown as Record<string, unknown>[]);
}

// --- Notifications ---

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  priority: string;
  is_read: number;
  created_at: string;
}

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  link?: string,
  priority: string = "info"
) {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO notifications (user_id, type, title, message, link, priority) VALUES (?, ?, ?, ?, ?, ?)",
    args: [userId, type, title, message, link || null, priority],
  });
}

export async function createNotificationForAll(
  type: string,
  title: string,
  message: string,
  link?: string,
  priority: string = "info"
) {
  const db = await ensureInit();
  const users = await db.execute("SELECT id FROM users");
  for (const u of users.rows) {
    const row = u as unknown as { id: number };
    await db.execute({
      sql: "INSERT INTO notifications (user_id, type, title, message, link, priority) VALUES (?, ?, ?, ?, ?, ?)",
      args: [row.id, type, title, message, link || null, priority],
    });
  }
}

export async function getNotifications(userId: number): Promise<Notification[]> {
  const db = await ensureInit();
  const result = await db.execute({
    sql: "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    args: [userId],
  });
  return rowsToArr<Notification>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await ensureInit();
  const result = await db.execute({
    sql: "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
    args: [userId],
  });
  return (result.rows[0] as unknown as { count: number }).count;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await ensureInit();
  await db.execute({
    sql: "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

export async function markAllNotificationsRead(userId: number) {
  const db = await ensureInit();
  await db.execute({
    sql: "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
    args: [userId],
  });
}

// --- Docs ---

export interface Doc {
  id: number;
  title: string;
  content: string;
  category: string;
  status: string;
  author: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DOC_CATEGORIES = [
  { value: "rules", label: "Rules" },
  { value: "commands", label: "Commands" },
  { value: "procedures", label: "Procedures" },
  { value: "guidelines", label: "Staff Guidelines" },
  { value: "general", label: "General" },
] as const;

export async function createDoc(title: string, content: string, category: string, author: string, status: string = "published") {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO docs (title, content, category, author, status) VALUES (?, ?, ?, ?, ?)",
    args: [title, content, category, author, status],
  });
  return { success: true };
}

export async function getAllDocs(includeDrafts = false): Promise<Doc[]> {
  const db = await ensureInit();
  if (includeDrafts) {
    const result = await db.execute("SELECT * FROM docs ORDER BY updated_at DESC");
    return rowsToArr<Doc>(result.rows as unknown as Record<string, unknown>[]);
  }
  const result = await db.execute("SELECT * FROM docs WHERE status = 'published' ORDER BY updated_at DESC");
  return rowsToArr<Doc>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getDoc(id: number): Promise<Doc | undefined> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT * FROM docs WHERE id = ?", args: [id] });
  if (result.rows.length === 0) return undefined;
  return rowToObj<Doc>(result.rows[0] as unknown as Record<string, unknown>);
}

export async function updateDoc(id: number, title: string, content: string, category: string, updatedBy: string, status?: string) {
  const db = await ensureInit();
  if (status) {
    await db.execute({
      sql: "UPDATE docs SET title = ?, content = ?, category = ?, updated_by = ?, updated_at = datetime('now'), status = ? WHERE id = ?",
      args: [title, content, category, updatedBy, status, id],
    });
  } else {
    await db.execute({
      sql: "UPDATE docs SET title = ?, content = ?, category = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?",
      args: [title, content, category, updatedBy, id],
    });
  }
  return { success: true };
}

export async function publishDoc(id: number) {
  const db = await ensureInit();
  await db.execute({ sql: "UPDATE docs SET status = 'published' WHERE id = ?", args: [id] });
  return { success: true };
}

export async function deleteDoc(id: number) {
  const db = await ensureInit();
  await db.execute({ sql: "DELETE FROM docs WHERE id = ?", args: [id] });
  return { success: true };
}

// --- Tasks ---

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: number;
  assigned_username?: string;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export const TASK_STATUSES = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

export async function createTask(
  title: string,
  description: string | null,
  priority: string,
  assignedTo: number,
  createdBy: string,
  dueDate: string | null
) {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO tasks (title, description, priority, assigned_to, created_by, due_date) VALUES (?, ?, ?, ?, ?, ?)",
    args: [title, description, priority, assignedTo, createdBy, dueDate],
  });
  return { success: true };
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await ensureInit();
  const result = await db.execute(
    "SELECT t.*, u.username as assigned_username FROM tasks t JOIN users u ON t.assigned_to = u.id ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'done' THEN 2 END, t.created_at DESC"
  );
  return rowsToArr<Task>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getTasksForUser(userId: number): Promise<Task[]> {
  const db = await ensureInit();
  const result = await db.execute({
    sql: "SELECT t.*, u.username as assigned_username FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE t.assigned_to = ? ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'done' THEN 2 END, t.created_at DESC",
    args: [userId],
  });
  return rowsToArr<Task>(result.rows as unknown as Record<string, unknown>[]);
}

export async function updateTaskStatus(id: number, status: string) {
  const db = await ensureInit();
  await db.execute({ sql: "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?", args: [status, id] });
  return { success: true };
}

export async function updateTask(id: number, title: string, description: string | null, priority: string, assignedTo: number, dueDate: string | null) {
  const db = await ensureInit();
  await db.execute({
    sql: "UPDATE tasks SET title = ?, description = ?, priority = ?, assigned_to = ?, due_date = ?, updated_at = datetime('now') WHERE id = ?",
    args: [title, description, priority, assignedTo, dueDate, id],
  });
  return { success: true };
}

export async function deleteTask(id: number) {
  const db = await ensureInit();
  await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
  return { success: true };
}

// --- Audit Logs ---

export interface AuditLog {
  id: number;
  action: string;
  target: string | null;
  performed_by: string;
  metadata: string | null;
  created_at: string;
}

export const AUDIT_ACTIONS = [
  "USER_CREATE",
  "USER_DELETE",
  "ROLE_CHANGE",
  "PASSWORD_RESET",
  "DOC_CREATE",
  "DOC_EDIT",
  "DOC_DELETE",
  "DOC_PUBLISH",
  "EVENT_CREATE",
  "EVENT_DELETE",
  "UPDATE_CREATE",
  "UPDATE_DELETE",
  "UPDATE_PUBLISH",
  "TASK_CREATE",
  "TASK_UPDATE",
  "TASK_DELETE",
  "LOGIN",
] as const;

export async function createAuditLog(action: string, target: string | null, performedBy: string, metadata?: Record<string, unknown>) {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO audit_logs (action, target, performed_by, metadata) VALUES (?, ?, ?, ?)",
    args: [action, target, performedBy, metadata ? JSON.stringify(metadata) : null],
  });
}

export async function getAuditLogs(limit = 100, offset = 0, filterAction?: string, filterUser?: string): Promise<AuditLog[]> {
  const db = await ensureInit();
  let query = "SELECT * FROM audit_logs WHERE 1=1";
  const params: (string | number)[] = [];

  if (filterAction) {
    query += " AND action = ?";
    params.push(filterAction);
  }
  if (filterUser) {
    query += " AND performed_by = ?";
    params.push(filterUser);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await db.execute({ sql: query, args: params });
  return rowsToArr<AuditLog>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getAuditLogCount(filterAction?: string, filterUser?: string): Promise<number> {
  const db = await ensureInit();
  let query = "SELECT COUNT(*) as count FROM audit_logs WHERE 1=1";
  const params: string[] = [];

  if (filterAction) {
    query += " AND action = ?";
    params.push(filterAction);
  }
  if (filterUser) {
    query += " AND performed_by = ?";
    params.push(filterUser);
  }

  const result = await db.execute({ sql: query, args: params });
  return (result.rows[0] as unknown as { count: number }).count;
}

// --- User Stats (for profiles) ---

export async function getUserTaskStats(userId: number): Promise<{ total: number; todo: number; in_progress: number; done: number }> {
  const db = await ensureInit();
  const total = (await db.execute({ sql: "SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ?", args: [userId] })).rows[0] as unknown as { c: number };
  const todo = (await db.execute({ sql: "SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status = 'todo'", args: [userId] })).rows[0] as unknown as { c: number };
  const inProgress = (await db.execute({ sql: "SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status = 'in_progress'", args: [userId] })).rows[0] as unknown as { c: number };
  const done = (await db.execute({ sql: "SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status = 'done'", args: [userId] })).rows[0] as unknown as { c: number };
  return { total: total.c, todo: todo.c, in_progress: inProgress.c, done: done.c };
}

export async function getUserEventsAttended(userId: number): Promise<number> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT COUNT(*) as c FROM event_rsvps WHERE user_id = ? AND status = 'attending'", args: [userId] });
  return (result.rows[0] as unknown as { c: number }).c;
}

export async function getUserAuditLogCount(username: string): Promise<number> {
  const db = await ensureInit();
  const result = await db.execute({ sql: "SELECT COUNT(*) as c FROM audit_logs WHERE performed_by = ?", args: [username] });
  return (result.rows[0] as unknown as { c: number }).c;
}

// --- Plugin Integration ---

export interface ServerStatus {
  id: number;
  online_players: number;
  max_players: number;
  tps: number;
  online_staff: string | null;
  staff_in_modmode: string | null;
  staff_vanished: string | null;
  frozen_players: string | null;
  panic_mode: number;
  chat_enabled: number;
  uptime_seconds: number;
  server_version: string | null;
  last_heartbeat: string;
}

export async function upsertServerStatus(data: Partial<Omit<ServerStatus, "id">>): Promise<void> {
  const db = await ensureInit();
  const existing = await db.execute("SELECT id FROM server_status WHERE id = 1");
  if (existing.rows.length > 0) {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    fields.push("last_heartbeat = datetime('now')");
    await db.execute({ sql: `UPDATE server_status SET ${fields.join(", ")} WHERE id = 1`, args: values as (string | number | null)[] });
  } else {
    await db.execute({
      sql: "INSERT INTO server_status (id, online_players, max_players, tps, online_staff, staff_in_modmode, staff_vanished, frozen_players, panic_mode, chat_enabled, uptime_seconds, server_version, last_heartbeat) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
      args: [
        data.online_players ?? 0, data.max_players ?? 0, data.tps ?? 20.0,
        data.online_staff ?? null, data.staff_in_modmode ?? null, data.staff_vanished ?? null, data.frozen_players ?? null,
        data.panic_mode ?? 0, data.chat_enabled ?? 1, data.uptime_seconds ?? 0, data.server_version ?? null,
      ],
    });
  }
}

export async function getServerStatus(): Promise<ServerStatus | null> {
  const db = await ensureInit();
  const result = await db.execute("SELECT * FROM server_status WHERE id = 1");
  if (result.rows.length === 0) return null;
  return rowToObj<ServerStatus>(result.rows[0] as unknown as Record<string, unknown>);
}

export interface PluginEvent {
  id: number;
  event_type: string;
  actor: string | null;
  target: string | null;
  reason: string | null;
  duration: string | null;
  metadata: string | null;
  server: string | null;
  created_at: string;
}

export async function createPluginEvent(eventType: string, actor?: string, target?: string, reason?: string, duration?: string, metadata?: Record<string, unknown>, server?: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO plugin_events (event_type, actor, target, reason, duration, metadata, server) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [eventType, actor ?? null, target ?? null, reason ?? null, duration ?? null, metadata ? JSON.stringify(metadata) : null, server ?? null],
  });
}

export async function getPluginEvents(limit = 50, offset = 0, eventType?: string): Promise<PluginEvent[]> {
  const db = await ensureInit();
  let query = "SELECT * FROM plugin_events WHERE 1=1";
  const params: (string | number)[] = [];
  if (eventType) {
    query += " AND event_type = ?";
    params.push(eventType);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const result = await db.execute({ sql: query, args: params });
  return rowsToArr<PluginEvent>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getPluginEventCount(eventType?: string): Promise<number> {
  const db = await ensureInit();
  let query = "SELECT COUNT(*) as c FROM plugin_events WHERE 1=1";
  const params: string[] = [];
  if (eventType) {
    query += " AND event_type = ?";
    params.push(eventType);
  }
  const result = await db.execute({ sql: query, args: params });
  return (result.rows[0] as unknown as { c: number }).c;
}

export interface McPunishment {
  id: number;
  punishment_type: string;
  player: string;
  player_uuid: string | null;
  issued_by: string;
  reason: string | null;
  duration: string | null;
  active: number;
  created_at: string;
  expires_at: string | null;
}

export async function createMcPunishment(type: string, player: string, issuedBy: string, reason?: string, duration?: string, playerUuid?: string, expiresAt?: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO mc_punishments (punishment_type, player, player_uuid, issued_by, reason, duration, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [type, player, playerUuid ?? null, issuedBy, reason ?? null, duration ?? null, expiresAt ?? null],
  });
}

export async function getMcPunishments(limit = 50, offset = 0, type?: string, activeOnly = false): Promise<McPunishment[]> {
  const db = await ensureInit();
  let query = "SELECT * FROM mc_punishments WHERE 1=1";
  const params: (string | number)[] = [];
  if (type) { query += " AND punishment_type = ?"; params.push(type); }
  if (activeOnly) { query += " AND active = 1"; }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const result = await db.execute({ sql: query, args: params });
  return rowsToArr<McPunishment>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getMcPunishmentCount(type?: string, activeOnly = false): Promise<number> {
  const db = await ensureInit();
  let query = "SELECT COUNT(*) as c FROM mc_punishments WHERE 1=1";
  const params: string[] = [];
  if (type) { query += " AND punishment_type = ?"; params.push(type); }
  if (activeOnly) { query += " AND active = 1"; }
  const result = await db.execute({ sql: query, args: params });
  return (result.rows[0] as unknown as { c: number }).c;
}

export async function deactivateMcPunishment(player: string, type: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: "UPDATE mc_punishments SET active = 0 WHERE player = ? AND punishment_type = ? AND active = 1",
    args: [player, type],
  });
}

export interface McReport {
  id: number;
  reporter: string;
  target: string;
  reason: string;
  server: string | null;
  world: string | null;
  handled: number;
  handled_by: string | null;
  created_at: string;
}

export async function createMcReport(reporter: string, target: string, reason: string, server?: string, world?: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO mc_reports (reporter, target, reason, server, world) VALUES (?, ?, ?, ?, ?)",
    args: [reporter, target, reason, server ?? null, world ?? null],
  });
}

export async function getMcReports(limit = 50, offset = 0, unhandledOnly = false): Promise<McReport[]> {
  const db = await ensureInit();
  let query = "SELECT * FROM mc_reports WHERE 1=1";
  const params: number[] = [];
  if (unhandledOnly) { query += " AND handled = 0"; }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const result = await db.execute({ sql: query, args: params });
  return rowsToArr<McReport>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getMcReportCount(unhandledOnly = false): Promise<number> {
  const db = await ensureInit();
  const query = unhandledOnly ? "SELECT COUNT(*) as c FROM mc_reports WHERE handled = 0" : "SELECT COUNT(*) as c FROM mc_reports";
  const result = await db.execute(query);
  return (result.rows[0] as unknown as { c: number }).c;
}

export async function handleMcReport(id: number, handledBy: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: "UPDATE mc_reports SET handled = 1, handled_by = ? WHERE id = ?",
    args: [handledBy, id],
  });
}

export interface McCase {
  id: number;
  case_id: string;
  player: string;
  player_uuid: string | null;
  offense: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  evidence: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function createMcCase(caseId: string, player: string, offense: string, createdBy: string, playerUuid?: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: "INSERT INTO mc_cases (case_id, player, player_uuid, offense, created_by) VALUES (?, ?, ?, ?, ?)",
    args: [caseId, player, playerUuid ?? null, offense, createdBy],
  });
}

export async function getMcCases(limit = 50, offset = 0, status?: string): Promise<McCase[]> {
  const db = await ensureInit();
  let query = "SELECT * FROM mc_cases WHERE 1=1";
  const params: (string | number)[] = [];
  if (status) { query += " AND status = ?"; params.push(status); }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const result = await db.execute({ sql: query, args: params });
  return rowsToArr<McCase>(result.rows as unknown as Record<string, unknown>[]);
}

export async function getMcCaseCount(status?: string): Promise<number> {
  const db = await ensureInit();
  let query = "SELECT COUNT(*) as c FROM mc_cases WHERE 1=1";
  const params: string[] = [];
  if (status) { query += " AND status = ?"; params.push(status); }
  const result = await db.execute({ sql: query, args: params });
  return (result.rows[0] as unknown as { c: number }).c;
}

export async function updateMcCase(caseId: string, updates: Partial<Pick<McCase, "status" | "assigned_to" | "notes" | "evidence">>): Promise<void> {
  const db = await ensureInit();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }
  fields.push("updated_at = datetime('now')");
  values.push(caseId);
  await db.execute({ sql: `UPDATE mc_cases SET ${fields.join(", ")} WHERE case_id = ?`, args: values as (string | number | null)[] });
}

export interface McStaffStats {
  id: number;
  username: string;
  mc_uuid: string | null;
  total_punishments: number;
  warnings_issued: number;
  mutes_issued: number;
  bans_issued: number;
  kicks_issued: number;
  reports_handled: number;
  modmode_time_mins: number;
  playtime_mins: number;
  last_online: string | null;
  updated_at: string;
}

export async function upsertMcStaffStats(username: string, stats: Partial<Omit<McStaffStats, "id" | "username" | "updated_at">>): Promise<void> {
  const db = await ensureInit();
  const existing = await db.execute({ sql: "SELECT id FROM mc_staff_stats WHERE username = ?", args: [username] });
  if (existing.rows.length > 0) {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, val] of Object.entries(stats)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    fields.push("updated_at = datetime('now')");
    values.push(username);
    await db.execute({ sql: `UPDATE mc_staff_stats SET ${fields.join(", ")} WHERE username = ?`, args: values as (string | number | null)[] });
  } else {
    await db.execute({
      sql: "INSERT INTO mc_staff_stats (username, mc_uuid, total_punishments, warnings_issued, mutes_issued, bans_issued, kicks_issued, reports_handled, modmode_time_mins, playtime_mins, last_online) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        username, stats.mc_uuid ?? null, stats.total_punishments ?? 0, stats.warnings_issued ?? 0, stats.mutes_issued ?? 0,
        stats.bans_issued ?? 0, stats.kicks_issued ?? 0, stats.reports_handled ?? 0, stats.modmode_time_mins ?? 0,
        stats.playtime_mins ?? 0, stats.last_online ?? null,
      ],
    });
  }
}

export async function getMcStaffStats(username?: string): Promise<McStaffStats[]> {
  const db = await ensureInit();
  if (username) {
    const result = await db.execute({ sql: "SELECT * FROM mc_staff_stats WHERE username = ?", args: [username] });
    return rowsToArr<McStaffStats>(result.rows as unknown as Record<string, unknown>[]);
  }
  const result = await db.execute("SELECT * FROM mc_staff_stats ORDER BY total_punishments DESC");
  return rowsToArr<McStaffStats>(result.rows as unknown as Record<string, unknown>[]);
}

// --- Dashboard Overview Stats ---

export async function getDashboardStats() {
  const db = await ensureInit();
  const count = async (sql: string, args: (string | number)[] = []) => {
    const r = await db.execute({ sql, args });
    return (r.rows[0] as unknown as { c: number }).c;
  };

  const totalStaff = await count("SELECT COUNT(*) as c FROM users");
  const tasksOverdue = await count("SELECT COUNT(*) as c FROM tasks WHERE due_date < date('now') AND status != 'done'");
  const tasksTodo = await count("SELECT COUNT(*) as c FROM tasks WHERE status = 'todo'");
  const tasksInProgress = await count("SELECT COUNT(*) as c FROM tasks WHERE status = 'in_progress'");
  const tasksDone = await count("SELECT COUNT(*) as c FROM tasks WHERE status = 'done'");
  const upcomingEvents = await count("SELECT COUNT(*) as c FROM events WHERE event_date >= date('now')");
  const draftUpdates = await count("SELECT COUNT(*) as c FROM updates WHERE status = 'draft'");
  const draftDocs = await count("SELECT COUNT(*) as c FROM docs WHERE status = 'draft'");
  const totalPunishments = await count("SELECT COUNT(*) as c FROM mc_punishments");
  const activeBans = await count("SELECT COUNT(*) as c FROM mc_punishments WHERE punishment_type = 'ban' AND active = 1");
  const openReports = await count("SELECT COUNT(*) as c FROM mc_reports WHERE handled = 0");
  const openCases = await count("SELECT COUNT(*) as c FROM mc_cases WHERE status = 'OPEN'");

  const recentLoginsResult = await db.execute("SELECT performed_by, created_at FROM audit_logs WHERE action = 'LOGIN' ORDER BY created_at DESC LIMIT 5");
  const recentLogins = rowsToArr<{ performed_by: string; created_at: string }>(recentLoginsResult.rows as unknown as Record<string, unknown>[]);

  const recentActivityResult = await db.execute("SELECT action, target, performed_by, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8");
  const recentActivity = rowsToArr<{ action: string; target: string; performed_by: string; created_at: string }>(recentActivityResult.rows as unknown as Record<string, unknown>[]);

  const recentPluginEventsResult = await db.execute("SELECT event_type, actor, target, reason, created_at FROM plugin_events ORDER BY created_at DESC LIMIT 8");
  const recentPluginEvents = rowsToArr<PluginEvent>(recentPluginEventsResult.rows as unknown as Record<string, unknown>[]);

  const serverStatus = await getServerStatus();

  return {
    totalStaff, tasksOverdue, tasksTodo, tasksInProgress, tasksDone,
    upcomingEvents, draftUpdates, draftDocs,
    totalPunishments, activeBans, openReports, openCases,
    recentLogins, recentActivity, recentPluginEvents, serverStatus,
  };
}
