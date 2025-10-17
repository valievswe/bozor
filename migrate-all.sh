#!/bin/bash

# migrate-all.sh - Migrate all tenant databases

echo "Starting database migrations for all tenants..."
echo "================================================"

# Array of database URLs
declare -a databases=(
  "postgresql://bozor_admin:46575116@localhost:5432/bozor"
  "postgresql://u2:13242003@localhost:5432/rizq_baraka"
  "postgresql://muzaffar_user:MuzSavdo_Pass_789!@localhost:5432/muzaffar_savdo_db"
  "postgresql://istiqlol_user:istiqlol46575116@localhost:5432/istiqlol_db"
  "postgresql://bogdod_user:bogdod46575116@localhost:5432/bogdod_db"
  "postgresql://beshariq_turon_user:46575116turon@localhost:5432/beshariq_turon_db"
  "postgresql://beshariq_user:46575116beshariq@localhost:5432/beshariq_db"
)

declare -a names=(
  "ipak_yuli (bozor)"
  "rizq_baraka"
  "muzaffar-savdo"
  "istiqlol"
  "bogdod"
  "beshariq-turon"
  "beshariq"
)

# Loop through and migrate each database
for i in "${!databases[@]}"; do
  echo ""
  echo "[$((i+1))/7] Migrating: ${names[$i]}"
  echo "----------------------------------------"
  
  DATABASE_URL="${databases[$i]}" npx prisma migrate deploy
  
  if [ $? -eq 0 ]; then
    echo "✅ ${names[$i]} migration completed successfully"
  else
    echo "❌ ${names[$i]} migration failed"
    exit 1
  fi
done

echo ""
echo "================================================"
echo "✅ All database migrations completed!"
echo "================================================"
