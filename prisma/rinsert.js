/**
 * Import Data from CSV Files
 * ===========================
 * This script imports owners, stores, and leases from CSV files
 * 
 * CSV Files Required:
 * - owners.csv (47 owners)
 * - stores.csv (53 stores)
 * - leases.csv (53 leases linking owners to stores)
 * 
 * Usage:
 * node rinsert.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// CONFIGURATION - Update these paths
const OWNERS_CSV = './rowners.csv';
const STORES_CSV = './rstores.csv';
const LEASES_CSV = './rleases.csv';
const ADMIN_EMAIL = 'admin@example.com'; // Your admin user email

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  // Get headers
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line (handles commas in quoted fields)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Convert string to boolean
 */
function toBoolean(str) {
  return str.toLowerCase() === 'true';
}

/**
 * Convert string to number
 */
function toNumber(str) {
  if (!str || str === '') return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Convert string to date
 */
function toDate(str) {
  if (!str || str === '') return null;
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Main import function
 */
async function importFromCSV() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           Import Data from CSV Files                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Check if files exist
    console.log('📋 Step 1: Checking CSV files...');
    
    if (!fs.existsSync(OWNERS_CSV)) {
      throw new Error(`Owners CSV not found: ${OWNERS_CSV}`);
    }
    if (!fs.existsSync(STORES_CSV)) {
      throw new Error(`Stores CSV not found: ${STORES_CSV}`);
    }
    if (!fs.existsSync(LEASES_CSV)) {
      throw new Error(`Leases CSV not found: ${LEASES_CSV}`);
    }
    
    console.log('   ✅ All CSV files found\n');

    // Get admin user
    console.log('👤 Step 2: Finding admin user...');
    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });

    if (!adminUser) {
      throw new Error(`Admin user '${ADMIN_EMAIL}' not found!`);
    }
    
    console.log(`   ✅ Admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

    // Parse CSV files
    console.log('📖 Step 3: Reading CSV files...');
    const ownersData = parseCSV(OWNERS_CSV);
    const storesData = parseCSV(STORES_CSV);
    const leasesData = parseCSV(LEASES_CSV);
    
    console.log(`   ✅ Owners: ${ownersData.length} rows`);
    console.log(`   ✅ Stores: ${storesData.length} rows`);
    console.log(`   ✅ Leases: ${leasesData.length} rows\n`);

    // Statistics
    const stats = {
      ownersCreated: 0,
      storesCreated: 0,
      leasesCreated: 0,
      errors: []
    };

    // Import Owners
    console.log('👥 Step 4: Importing Owners...\n');
    const ownerIdMap = new Map(); // CSV owner_id -> DB owner id
    
    for (const ownerRow of ownersData) {
      try {
        const csvOwnerId = parseInt(ownerRow.owner_id);
        
        // Check if owner exists by TIN
        let owner = await prisma.owner.findUnique({
          where: { tin: ownerRow.tin }
        });

        if (owner) {
          console.log(`   ℹ Owner already exists: ${ownerRow.full_name} (${ownerRow.tin})`);
          ownerIdMap.set(csvOwnerId, owner.id);
        } else {
          owner = await prisma.owner.create({
            data: {
              fullName: ownerRow.full_name,
              tin: ownerRow.tin,
              address: ownerRow.address || null,
              phoneNumber: ownerRow.phone_number || null,
              activityType: ownerRow.activity_type || null,
              isActive: toBoolean(ownerRow.is_active),
              createdById: adminUser.id
            }
          });
          
          ownerIdMap.set(csvOwnerId, owner.id);
          stats.ownersCreated++;
          console.log(`   ✓ Created owner #${owner.id}: ${ownerRow.full_name}`);
        }
      } catch (error) {
        console.error(`   ❌ Error importing owner: ${error.message}`);
        stats.errors.push({ type: 'owner', data: ownerRow.full_name, error: error.message });
      }
    }

    console.log(`\n   📊 Owners: ${stats.ownersCreated} created, ${ownerIdMap.size - stats.ownersCreated} existed\n`);

    // Import Stores
    console.log('🏪 Step 5: Importing Stores...\n');
    const storeIdMap = new Map(); // CSV store_id -> DB store id
    
    for (const storeRow of storesData) {
      try {
        const csvStoreId = parseInt(storeRow.store_id);
        
        // Check if store exists
        let store = await prisma.store.findUnique({
          where: { storeNumber: storeRow.store_number }
        });

        if (store) {
          console.log(`   ℹ Store already exists: #${storeRow.store_number}`);
          storeIdMap.set(csvStoreId, store.id);
        } else {
          store = await prisma.store.create({
            data: {
              storeNumber: storeRow.store_number,
              area: toNumber(storeRow.area) || 0,
              type: storeRow.type || 'SHOP',
              kassaID: storeRow.store_number, // Using store number as kassa ID
              description: storeRow.description || null
            }
          });
          
          storeIdMap.set(csvStoreId, store.id);
          stats.storesCreated++;
          console.log(`   ✓ Created store #${store.id}: ${storeRow.store_number}`);
        }
      } catch (error) {
        console.error(`   ❌ Error importing store: ${error.message}`);
        stats.errors.push({ type: 'store', data: storeRow.store_number, error: error.message });
      }
    }

    console.log(`\n   📊 Stores: ${stats.storesCreated} created, ${storeIdMap.size - stats.storesCreated} existed\n`);

    // Import Leases
    console.log('📄 Step 6: Importing Leases...\n');
    
    for (const leaseRow of leasesData) {
      try {
        const csvOwnerId = parseInt(leaseRow.owner_id);
        const csvStoreId = parseInt(leaseRow.store_id);
        
        // Get actual database IDs
        const dbOwnerId = ownerIdMap.get(csvOwnerId);
        const dbStoreId = storeIdMap.get(csvStoreId);
        
        if (!dbOwnerId) {
          throw new Error(`Owner with CSV ID ${csvOwnerId} not found in database`);
        }
        if (!dbStoreId) {
          throw new Error(`Store with CSV ID ${csvStoreId} not found in database`);
        }

        const lease = await prisma.lease.create({
          data: {
            ownerId: dbOwnerId,
            storeId: dbStoreId,
            stallId: null,
            certificateNumber: leaseRow.certificate_number || null,
            issueDate: toDate(leaseRow.issue_date),
            expiryDate: toDate(leaseRow.expiry_date),
            shopMonthlyFee: toNumber(leaseRow.monthly_fee),
            stallMonthlyFee: null,
            guardFee: null,
            paymentInterval: leaseRow.payment_interval || 'MONTHLY',
            isActive: toBoolean(leaseRow.is_active),
            createdById: adminUser.id
          }
        });
        
        stats.leasesCreated++;
        
        // Get owner and store info for display
        const owner = await prisma.owner.findUnique({ where: { id: dbOwnerId } });
        const store = await prisma.store.findUnique({ where: { id: dbStoreId } });
        
        console.log(`   ✓ Created lease #${lease.id}: ${owner.fullName} → Store ${store.storeNumber}`);
        
      } catch (error) {
        console.error(`   ❌ Error importing lease: ${error.message}`);
        stats.errors.push({ type: 'lease', data: leaseRow.lease_id, error: error.message });
      }
    }

    console.log(`\n   📊 Leases: ${stats.leasesCreated} created\n`);

    // Print Summary
    console.log('═'.repeat(60));
    console.log('                  IMPORT SUMMARY');
    console.log('═'.repeat(60));
    console.log(`👥 Owners created:       ${stats.ownersCreated}`);
    console.log(`🏪 Stores created:       ${stats.storesCreated}`);
    console.log(`📄 Leases created:       ${stats.leasesCreated}`);
    console.log(`❌ Errors:               ${stats.errors.length}`);
    console.log('═'.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(err => {
        console.log(`   ${err.type}: ${err.data} - ${err.error}`);
      });
    }

    console.log('\n✨ Import completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importFromCSV()
    .then(() => {
      console.log('🎉 All done!');
      console.log('\n💡 Next steps:');
      console.log('   - Verify data: npx prisma studio');
      console.log('   - Check your database\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed');
      process.exit(1);
    });
}

module.exports = { importFromCSV };
