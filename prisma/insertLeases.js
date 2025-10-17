// insertLeases.js
// Script to insert leases from the lease mapping data
// Run with: node insertLeases.js
// PREREQUISITE: Run insertOwners.js and insertStores.js first

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import lease data from leaseData.js
const { leaseData } = require('./blease');

async function insertLeases() {
  try {
    // IMPORTANT: Set your admin user ID
    const ADMIN_USER_ID = 1; // <-- UPDATE THIS

    console.log('Starting lease insertion process...\n');

    // First, get all owners and create a TIN to ID map
    console.log('Fetching owners from database...');
    const owners = await prisma.owner.findMany({
      select: { id: true, tin: true, fullName: true }
    });

    const ownerMap = new Map();
    owners.forEach(owner => {
      ownerMap.set(owner.tin, owner);
    });

    console.log(`✓ Found ${owners.length} owners in database\n`);

    // Get all stores and create a storeNumber to ID map
    console.log('Fetching stores from database...');
    const stores = await prisma.store.findMany({
      select: { id: true, storeNumber: true }
    });

    const storeMap = new Map();
    stores.forEach(store => {
      storeMap.set(store.storeNumber, store);
    });

    console.log(`✓ Found ${stores.length} stores in database\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('Creating leases...\n');

    for (const leaseInfo of leaseData) {
      const owner = ownerMap.get(leaseInfo.ownerTIN);
      
      if (!owner) {
        errorCount++;
        errors.push(`Row ${leaseInfo.row}: Owner not found - TIN: ${leaseInfo.ownerTIN}`);
        continue;
      }

      // For each store number in the array, create a lease
      for (const storeNum of leaseInfo.storeNumbers) {
        const store = storeMap.get(String(storeNum));
        
        if (!store) {
          errorCount++;
          errors.push(`Row ${leaseInfo.row}: Store #${storeNum} not found`);
          continue;
        }

        try {
          // Calculate per-store monthly fee if multiple stores
          const numStores = leaseInfo.storeNumbers.length;
          const perStoreMonthlyFee = leaseInfo.monthlyFee 
            ? Math.round(leaseInfo.monthlyFee / numStores)
            : null;

          const lease = await prisma.lease.create({
            data: {
              certificateNumber: leaseInfo.contractNumber,
              issueDate: null, // Set if you have this data
              expiryDate: null, // Set if you have this data
              isActive: true,
              shopMonthlyFee: perStoreMonthlyFee,
              stallMonthlyFee: null,
              guardFee: null,
              ownerId: owner.id,
              storeId: store.id,
              stallId: null,
              paymentInterval: 'MONTHLY',
              createdById: ADMIN_USER_ID
            }
          });

          // Update store area and description if available
          if (leaseInfo.totalArea > 0) {
            const perStoreArea = leaseInfo.totalArea / numStores;
            await prisma.store.update({
              where: { id: store.id },
              data: {
                area: perStoreArea,
                description: leaseInfo.activity
              }
            });
          }

          successCount++;
          console.log(`✓ Created lease: ${owner.fullName} -> Store #${storeNum} (Contract: ${leaseInfo.contractNumber})`);

        } catch (error) {
          errorCount++;
          errors.push(`Row ${leaseInfo.row}, Store #${storeNum}: ${error.message}`);
        }
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✓ Successfully created: ${successCount} leases`);
    console.log(`✗ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach(err => console.log(`  ${err}`));
    }

    // Show statistics
    const totalLeases = await prisma.lease.count();
    const activeLeases = await prisma.lease.count({ where: { isActive: true } });
    const occupiedStores = await prisma.lease.count({
      where: { storeId: { not: null } },
      distinct: ['storeId']
    });

    console.log('\n=== DATABASE STATISTICS ===');
    console.log(`Total leases in database: ${totalLeases}`);
    console.log(`Active leases: ${activeLeases}`);
    console.log(`Occupied stores: ${occupiedStores}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the insertion
insertLeases();
