import { createClient, type Client } from "@libsql/client";
import type { InValue } from "@libsql/core/api";

type QueryResult<T = unknown> = {
  data: T | null;
  error: Error | null;
  count?: number | null;
};

type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "IS" | "IS NOT" | "IN" | "LIKE";

type Filter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};

type Order = {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
};

type SelectOptions = {
  count?: "exact";
  head?: boolean;
};

type Mutation = {
  type: "insert" | "update" | "upsert";
  values: Record<string, unknown> | Record<string, unknown>[];
};

const JSON_COLUMNS = new Set([
  "detail_json",
  "gemini_faq_json",
  "tags",
  "metadata",
  "variables",
]);

const UPSERT_CONFLICTS: Record<string, string[]> = {
  admin_settings: ["key"],
  benefits: ["id"],
  posts: ["slug"],
  content_duplicates: ["content_hash"],
  benefit_content: ["benefit_id", "content_type"],
  content_sections: ["benefit_content_id", "section_type"],
  seo_metadata: ["page_type", "page_id"],
};

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;

const normalizeColumn = (column: string) => column.trim().replace(/"/g, "");

const serializeValue = (value: unknown): InValue => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof ArrayBuffer) return value;
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return value;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return String(value);
};

const deserializeValue = (column: string, value: unknown) => {
  if (typeof value !== "string" || !JSON_COLUMNS.has(column)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const deserializeRow = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [key, deserializeValue(key, value)]));

const selectClause = (columns: string | undefined) => {
  if (!columns || columns.trim() === "*" || columns.includes("(")) return "*";
  return columns
    .split(",")
    .map((column) => quoteIdent(normalizeColumn(column)))
    .join(", ");
};

const resolveTursoEnv = () => {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
  return url && authToken ? { url, authToken } : null;
};

let tursoClient: Client | null = null;

const getClient = () => {
  const config = resolveTursoEnv();
  if (!config) {
    throw new Error("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN 환경 변수가 설정되지 않았습니다.");
  }
  tursoClient ??= createClient(config);
  return tursoClient;
};

class TursoQueryBuilder<T = unknown> implements PromiseLike<QueryResult<T>> {
  private columns = "*";
  private selectOptions: SelectOptions = {};
  private filters: Filter[] = [];
  private orGroups: Filter[][] = [];
  private orders: Order[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private mutation?: Mutation;
  private wantsSingle = false;
  private allowsNullSingle = false;

  constructor(private readonly table: string) {}

  select(columns = "*", options: SelectOptions = {}) {
    this.columns = columns;
    this.selectOptions = options;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutation = { type: "insert", values };
    return this;
  }

  update(values: Record<string, unknown>) {
    this.mutation = { type: "update", values };
    return this;
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutation = { type: "upsert", values };
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: "=", value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: "!=", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, operator: ">", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: "<", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, operator: ">=", value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, operator: "<=", value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, operator: "IN", value: values });
    return this;
  }

  is(column: string, value: unknown) {
    if (value === null) this.filters.push({ column, operator: "IS", value: null });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, operator: "LIKE", value });
    return this;
  }

  match(values: Record<string, unknown>) {
    Object.entries(values).forEach(([column, value]) => {
      this.filters.push({ column, operator: "=", value });
    });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === "is" && value === null) {
      this.filters.push({ column, operator: "IS NOT", value: null });
    }
    return this;
  }

  or(expression: string) {
    const group = expression
      .split(",")
      .map((part) => part.trim())
      .map((part): Filter | null => {
        const [column, operator, ...rest] = part.split(".");
        const value = rest.join(".");
        if (!column || !operator) return null;
        if (operator === "is" && value === "null") return { column, operator: "IS", value: null };
        if (operator === "lte") return { column, operator: "<=", value };
        if (operator === "gte") return { column, operator: ">=", value };
        if (operator === "lt") return { column, operator: "<", value };
        if (operator === "gt") return { column, operator: ">", value };
        if (operator === "eq") return { column, operator: "=", value };
        return null;
      })
      .filter((item): item is Filter => Boolean(item));

    if (group.length > 0) this.orGroups.push(group);
    return this;
  }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    this.orders.push({
      column,
      ascending: options.ascending ?? true,
      nullsFirst: options.nullsFirst,
    });
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = Math.max(to - from + 1, 0);
    return this;
  }

  single() {
    this.wantsSingle = true;
    this.allowsNullSingle = false;
    return this;
  }

  maybeSingle() {
    this.wantsSingle = true;
    this.allowsNullSingle = true;
    return this;
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private filterSql(filter: Filter, args: InValue[]) {
    const column = quoteIdent(normalizeColumn(filter.column));
    if (filter.operator === "IS" || filter.operator === "IS NOT") {
      return `${column} ${filter.operator} NULL`;
    }
    if (filter.operator === "IN") {
      const values = Array.isArray(filter.value) ? filter.value : [];
      if (values.length === 0) return "1 = 0";
      args.push(...values.map(serializeValue));
      return `${column} IN (${values.map(() => "?").join(", ")})`;
    }
    if (filter.operator === "LIKE") {
      args.push(serializeValue(filter.value));
      return `${column} LIKE ? COLLATE NOCASE`;
    }
    args.push(serializeValue(filter.value));
    return `${column} ${filter.operator} ?`;
  }

  private whereSql(args: InValue[]) {
    const clauses = this.filters.map((filter) => this.filterSql(filter, args));
    this.orGroups.forEach((group) => {
      const groupSql = group.map((filter) => this.filterSql(filter, args)).join(" OR ");
      clauses.push(`(${groupSql})`);
    });
    return clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  }

  private orderSql() {
    if (this.orders.length === 0) return "";
    return ` ORDER BY ${this.orders
      .map((order) => {
        const nulls =
          typeof order.nullsFirst === "boolean" ? ` NULLS ${order.nullsFirst ? "FIRST" : "LAST"}` : "";
        return `${quoteIdent(normalizeColumn(order.column))} ${order.ascending ? "ASC" : "DESC"}${nulls}`;
      })
      .join(", ")}`;
  }

  private limitSql(args: InValue[]) {
    if (this.limitValue === undefined) return "";
    args.push(this.limitValue);
    const offset = this.offsetValue !== undefined ? " OFFSET ?" : "";
    if (this.offsetValue !== undefined) args.push(this.offsetValue);
    return ` LIMIT ?${offset}`;
  }

  private async execute(): Promise<QueryResult<T>> {
    try {
      if (this.mutation) return await this.executeMutation();
      return await this.executeSelect();
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private async executeSelect(): Promise<QueryResult<T>> {
    const client = getClient();
    const args: InValue[] = [];
    const where = this.whereSql(args);
    const countArgs: InValue[] = [];
    const countWhere = this.whereSql(countArgs);
    const countSql = `SELECT COUNT(*) AS count FROM ${quoteIdent(this.table)}${countWhere}`;

    if (this.selectOptions.head) {
      const countResult = await client.execute({ sql: countSql, args: countArgs });
      return { data: null, error: null, count: Number(countResult.rows[0]?.count ?? 0) };
    }

    const sql = `SELECT ${selectClause(this.columns)} FROM ${quoteIdent(this.table)}${where}${this.orderSql()}${this.limitSql(args)}`;
    const result = await client.execute({ sql, args });
    const rows = result.rows.map((row) => deserializeRow(row as Record<string, unknown>));

    const count =
      this.selectOptions.count === "exact"
        ? Number((await client.execute({ sql: countSql, args: countArgs })).rows[0]?.count ?? 0)
        : null;

    if (this.wantsSingle) {
      if (rows.length === 0 && this.allowsNullSingle) return { data: null, error: null, count };
      if (rows.length === 0) return { data: null, error: new Error("No rows returned"), count };
      return { data: rows[0] as T, error: null, count };
    }

    return { data: rows as T, error: null, count };
  }

  private async executeMutation(): Promise<QueryResult<T>> {
    const mutation = this.mutation!;
    if (mutation.type === "update") return await this.executeUpdate(mutation.values as Record<string, unknown>);

    const values = Array.isArray(mutation.values) ? mutation.values : [mutation.values];
    if (values.length === 0) return { data: [] as T, error: null };

    const client = getClient();
    const inserted: Record<string, unknown>[] = [];

    for (const row of values) {
      const columns = Object.keys(row);
      const args = columns.map((column) => serializeValue(row[column]));
      const conflict = UPSERT_CONFLICTS[this.table];
      const updateSql =
        mutation.type === "upsert" && conflict
          ? ` ON CONFLICT (${conflict.map(quoteIdent).join(", ")}) DO UPDATE SET ${columns
              .filter((column) => !conflict.includes(column))
              .map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`)
              .join(", ")}`
          : "";
      const verb = mutation.type === "upsert" && !conflict ? "INSERT OR REPLACE" : "INSERT";
      await client.execute({
        sql: `${verb} INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(", ")}) VALUES (${columns
          .map(() => "?")
          .join(", ")})${updateSql}`,
        args,
      });
      inserted.push(row);
    }

    if (this.wantsSingle) return { data: inserted[0] as T, error: null };
    return { data: inserted as T, error: null };
  }

  private async executeUpdate(values: Record<string, unknown>): Promise<QueryResult<T>> {
    const client = getClient();
    const columns = Object.keys(values);
    const args = columns.map((column) => serializeValue(values[column]));
    const where = this.whereSql(args);
    await client.execute({
      sql: `UPDATE ${quoteIdent(this.table)} SET ${columns.map((column) => `${quoteIdent(column)} = ?`).join(", ")}${where}`,
      args,
    });
    return { data: null, error: null };
  }
}

export type TursoCompatClient = {
  from: <T = unknown>(table: string) => TursoQueryBuilder<T>;
};

export const isTursoConfigured = () => Boolean(resolveTursoEnv());

export const createTursoCompatClient = (): TursoCompatClient => ({
  from: <T = unknown>(table: string) => new TursoQueryBuilder<T>(table),
});
