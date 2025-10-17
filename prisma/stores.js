// insertStores.js
// Script to insert 500 stores into PostgreSQL database
// Run with: node insertStores.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertStores() {
  try {
    // Generate 500 stores
    const NUMBER_OF_STORES = 500;
    const DEFAULT_KASSA_ID = "PLACEHOLDER_KASSA_ID"; // UPDATE with real Payme Kassa ID

    console.log(`Preparing to insert ${NUMBER_OF_STORES} stores...\n`);

    const stores = [];
    for (let i = 1; i <= NUMBER_OF_STORES; i++) {
      stores.push({
        storeNumber: String(i),
        area: 0, // Default, will be updated when creating leases
        description: null,
        type: 'SHOP',
        kassaID: DEFAULT_KASSA_ID,
        sortKey: i
      });
    }

    // Batch insert using createMany for better performance
    const result = await prisma.store.createMany({
      data: stores,
      skipDuplicates: true // Skip if store number already exists
    });

    console.log(`✓ Successfully inserted ${result.count} stores`);
    console.log(`\nStores created: #1 through #${NUMBER_OF_STORES}`);
    
    // Verify insertion
    const totalStores = await prisma.store.count();
    console.log(`\nTotal stores in database: ${totalStores}`);

  } catch (error) {
    console.error('Error inserting stores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the insertion
insertStores();
