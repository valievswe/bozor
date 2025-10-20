const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// Get migration name from terminal argument
const migrationName = process.argv[2];
if (!migrationName) {
  console.error("❌ Please provide a migration name, e.g.:");
  console.error("   node migrate-all.js init");
  process.exit(1);
}

// Path to ecosystem.config.js
const ecosystemPath = path.resolve("ecosystem.config.js");

// Read all DATABASE_URLs from ecosystem file
const ecosystem = require(ecosystemPath);
const dbEnvs = ecosystem.apps?.[0]?.env || {};

const dbUrls = Object.entries(dbEnvs)
  .filter(([key]) => key.startsWith("DATABASE_URL"))
  .map(([key, value]) => ({
    name: key.replace("DATABASE_URL_", ""),
    url: value,
  }));

if (!dbUrls.length) {
  console.error("❌ No DATABASE_URLs found in ecosystem.config.js");
  process.exit(1);
}

// Create a temporary .env file
const envPath = path.resolve(".env");

console.log(`🚀 Starting migrations for ${dbUrls.length} databases...\n`);

dbUrls.forEach(({ name, url }, index) => {
  console.log(`🟢 Running migration for ${name}...`);
  fs.writeFileSync(envPath, `DATABASE_URL="${url}"`);

  try {
    if (index === 0) {
      console.log(`➡️ Creating new migration: ${migrationName}`);
      execSync(`npx prisma migrate dev --name ${migrationName}`, {
        stdio: "inherit",
      });
    } else {
      console.log(`➡️ Applying migration files to ${name}`);
      execSync(`npx prisma migrate deploy`, { stdio: "inherit" });
    }

    console.log(`✅ ${name} migration done!\n`);
  } catch (error) {
    console.error(`❌ Migration failed for ${name}:`, error.message);
  }
});

// Clean up temp .env
fs.unlinkSync(envPath);

console.log("🎉 All migrations complete!");
