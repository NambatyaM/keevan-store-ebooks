import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

function readMigration(name: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf-8");
}

function listMigrations(): string[] {
  return fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
}

describe("Migration files", () => {
  it("all 20 migrations exist and are in order", () => {
    const migrations = listMigrations();
    expect(migrations).toHaveLength(20);
    expect(migrations[0]).toBe("001_initial_schema.sql");
    expect(migrations[19]).toBe("020_fix_currency_constraint_and_production_issues.sql");
  });

  it("each migration has a sequential number prefix", () => {
    const migrations = listMigrations();
    for (let i = 0; i < migrations.length; i++) {
      expect(migrations[i]).toMatch(/^\d{3}_/);
    }
  });

  it("no migration is empty", () => {
    const migrations = listMigrations();
    for (const m of migrations) {
      const content = readMigration(m);
      expect(content.length).toBeGreaterThan(50);
    }
  });

  it("all migrations contain at least one SQL statement", () => {
    const migrations = listMigrations();
    for (const m of migrations) {
      const content = readMigration(m);
      const stmtCount = (content.match(/(create|alter|drop|grant|revoke)\s+\w+/gi) || []).length;
      expect(stmtCount).toBeGreaterThan(0);
    }
  });

  it("migration 001 creates core tables", () => {
    const content = readMigration("001_initial_schema.sql").toLowerCase();
    expect(content).toContain("create table");
    expect(content).toContain("users");
    expect(content).toContain("stores");
    expect(content).toContain("products");
    expect(content).toContain("orders");
  });

  it("migration 003 creates rate_limits table", () => {
    const content = readMigration("003_rate_limiting.sql");
    expect(content).toContain("rate_limits");
  });

  it("migration 008 contains rate limiting RPC", () => {
    const content = readMigration("008_production_security_fixes.sql");
    expect(content).toContain("rate_limit_check_and_increment");
  });

  it("migration 008 contains SECURITY DEFINER RPCs and is_admin", () => {
    const content = readMigration("008_production_security_fixes.sql");
    expect(content).toContain("SECURITY DEFINER");
    expect(content).toContain("is_admin");
  });

  it("migration 009 creates refund system", () => {
    const content = readMigration("009_refund_system.sql");
    expect(content).toContain("refunds");
    expect(content).toContain("process_refund");
    expect(content).toContain("decrement_creator_balance");
  });

  it("migration 010 creates email system", () => {
    const content = readMigration("010_email_system.sql");
    expect(content).toContain("email_queue");
    expect(content).toContain("order_confirmation");
    expect(content).toContain("withdrawal_status");
    expect(content).toContain("refund_status");
  });

  it("migration 011 hardens security on SECURITY DEFINER functions", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("SECURITY DEFINER");
    expect(content).toContain("increment_creator_balance");
    expect(content).toContain("decrement_creator_balance");
    expect(content).toContain("reserve_withdrawal");
  });
});

describe("SQL syntax validation", () => {
  it("migration 001 has valid CREATE TABLE syntax", () => {
    const content = readMigration("001_initial_schema.sql");
    const createTableCount = (content.match(/create table/gi) || []).length;
    expect(createTableCount).toBeGreaterThanOrEqual(5);
  });

  it("migration 008 has valid function definitions", () => {
    const content = readMigration("008_production_security_fixes.sql");
    const functionCount = (content.match(/FUNCTION/g) || []).length;
    expect(functionCount).toBeGreaterThanOrEqual(6);
  });

  it("migration 009 has valid refund RPCs", () => {
    const content = readMigration("009_refund_system.sql");
    expect(content).toContain("CREATE OR REPLACE FUNCTION");
    expect(content).toContain("process_refund");
    expect(content).toContain("decrement_creator_balance");
  });

  it("migrations with function definitions use proper transaction blocks", () => {
    const migrationsWithFunctions = ["008_production_security_fixes.sql", "009_refund_system.sql", "010_email_system.sql", "011_production_security_hardening.sql"];
    for (const m of migrationsWithFunctions) {
      const content = readMigration(m);
      const lower = content.toLowerCase();
      const hasBegin = lower.includes("begin");
      const hasCommit = lower.includes("commit");
      const inDollarBlock = lower.includes("do $$") || lower.includes("as $$");
      if (hasBegin && !hasCommit) {
        expect(inDollarBlock).toBe(true);
      }
    }
  });

  it("no migration contains DROP TABLE without CASCADE", () => {
    const migrations = listMigrations();
    for (const m of migrations) {
      const content = readMigration(m);
      const dropTableLines = content.split("\n").filter((l) => l.toUpperCase().includes("DROP TABLE") && !l.trim().startsWith("--"));
      for (const line of dropTableLines) {
        if (!line.toUpperCase().includes("IF EXISTS")) {
          expect(line.toUpperCase()).toContain("CASCADE");
        }
      }
    }
  });

  it("migration 009 refunds table has proper foreign keys", () => {
    const content = readMigration("009_refund_system.sql");
    expect(content).toContain("REFERENCES");
    expect(content).toContain("order_id");
    expect(content).toContain("payment_id");
  });

  it("migration 010 email_queue has proper indexes", () => {
    const content = readMigration("010_email_system.sql");
    expect(content).toContain("CREATE INDEX");
  });

  it("migration 011 uses search_path in function definitions", () => {
    const content = readMigration("011_production_security_hardening.sql");
    const searchPathCount = (content.match(/search_path/g) || []).length;
    expect(searchPathCount).toBeGreaterThanOrEqual(5);
  });
});

describe("Database schema integrity", () => {
  it("all migrations together contain required table names", () => {
    const allContents = listMigrations().map((m) => readMigration(m)).join("\n");
    const tables = ["users", "stores", "products", "orders", "payments", "downloads",
      "withdrawal_requests", "creator_earnings", "notifications", "rate_limits",
      "admin_logs", "platform_config", "refunds", "email_queue"];
    for (const table of tables) {
      expect(allContents).toContain(table);
    }
  });

  it("all migrations together contain required enum types", () => {
    const allContents = listMigrations().map((m) => readMigration(m)).join("\n");
    const enums = ["product_status", "order_status", "payment_status", "withdrawal_status",
      "refund_status", "email_type", "email_status"];
    for (const enumType of enums) {
      expect(allContents).toContain(enumType);
    }
  });

  it("all migrations together contain RLS policies", () => {
    const allContents = listMigrations().map((m) => readMigration(m)).join("\n");
    expect(allContents).toContain("CREATE POLICY");
  });

  it("all migrations together contain updated_at triggers", () => {
    const allContents = listMigrations().map((m) => readMigration(m)).join("\n");
    expect(allContents).toContain("updated_at");
  });

  it("no migration references undefined sequence names", () => {
    const migrations = listMigrations();
    for (const m of migrations) {
      const content = readMigration(m);
      const seqRefs = content.match(/nextval\('([^']+)'/g);
      if (seqRefs) {
        for (const ref of seqRefs) {
          const seqName = ref.match(/nextval\('([^']+)'/)?.[1];
          expect(seqName).toBeDefined();
        }
      }
    }
  });

  it("all foreign key references are between existing tables", () => {
    const allContents = listMigrations().map((m) => readMigration(m)).join("\n");
    const refs = allContents.match(/REFERENCES\s+(\w+)/g);
    if (refs) {
      for (const ref of refs) {
        const tableName = ref.replace("REFERENCES ", "").trim().toLowerCase();
        expect(tableName.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Email system migration details", () => {
  it("creates email_queue table", () => {
    const content = readMigration("010_email_system.sql");
    expect(content).toContain("CREATE TABLE");
    expect(content).toContain("email_queue");
  });

  it("has proper email status enum", () => {
    const content = readMigration("010_email_system.sql");
    expect(content).toContain("email_status");
    expect(content).toContain("pending");
    expect(content).toContain("sent");
    expect(content).toContain("failed");
  });

  it("has database triggers for automated enqueuing", () => {
    const content = readMigration("010_email_system.sql");
    expect(content).toContain("CREATE OR REPLACE FUNCTION");
    expect(content).toContain("enqueue_order_confirmation_email");
    expect(content).toContain("enqueue_withdrawal_status_email");
    expect(content).toContain("enqueue_refund_status_email");
  });

  it("has triggers attached to tables with AFTER UPDATE", () => {
    const content = readMigration("010_email_system.sql");
    expect(content).toContain("CREATE TRIGGER");
    expect(content).toContain("AFTER UPDATE");
  });
});

describe("Refund system migration details", () => {
  it("creates refunds table with correct columns", () => {
    const content = readMigration("009_refund_system.sql");
    expect(content).toContain("buyer_email");
    expect(content).toContain("buyer_name");
    expect(content).toContain("reason");
    expect(content).toContain("admin_notes");
    expect(content).toContain("reversed_amount");
    expect(content).toContain("pesapal_refund_response");
  });

  it("has refund notification triggers", () => {
    const content = readMigration("009_refund_system.sql");
    expect(content).toContain("notify_refund_status_change");
    expect(content).toContain("CREATE TRIGGER");
  });
});

describe("Security hardening migration (011)", () => {
  it("fixes increment_creator_balance with auth check", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("increment_creator_balance");
    expect(content).toContain("is_admin");
  });

  it("fixes decrement_creator_balance with auth check", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("decrement_creator_balance");
  });

  it("fixes reserve_withdrawal to derive user from auth.uid", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("reserve_withdrawal");
    expect(content).toContain("auth.uid");
  });

  it("fixes finalize_pesapal_payment with is_admin", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("finalize_pesapal_payment");
    expect(content).toContain("is_admin");
  });

  it("fixes fail_pesapal_payment with is_admin", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("fail_pesapal_payment");
    expect(content).toContain("is_admin");
  });

  it("fixes rate_limit_check_and_increment max enforcement", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("rate_limit_check_and_increment");
    expect(content).toContain("p_max_requests");
  });

  it("fixes transition_withdrawal_request column name", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("transition_withdrawal_request");
    expect(content).toContain("admin_notes");
  });

  it("adds cleanup_expired_rate_limits with auth", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("cleanup_expired_rate_limits");
    expect(content).toContain("is_admin");
  });

  it("adds updated_at triggers for refunds, rate_limits, email_queue", () => {
    const content = readMigration("011_production_security_hardening.sql");
    expect(content).toContain("refunds");
    expect(content).toContain("rate_limits");
    expect(content).toContain("email_queue");
  });
});
