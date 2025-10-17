// createStores.js
// Flexible script to create any number of stores
// Usage: node createStores.js <number_of_stores> [starting_number]
// Example: node createStores.js 100        (creates stores 1-100)
// Example: node createStores.js 50 101     (creates stores 101-150)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createStores() {
  try {
    // Get arguments from command line
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('\n❌ Error: Number of stores is required\n');
      console.log('Usage: node createStores.js <number_of_stores> [starting_number]');
      console.log('\nExamples:');
      console.log('  node createStores.js 100          # Creates stores 1-100');
      console.log('  node createStores.js 50 101       # Creates stores 101-150');
      console.log('  node createStores.js 200 1        # Creates stores 1-200');
      console.log('');
      process.exit(1);
    }

    const numberOfStores = parseInt(args[0]);
    const startingNumber = args[1] ? parseInt(args[1]) : 1;
    
    if (isNaN(numberOfStores) || numberOfStores <= 0) {
      console.error('❌ Error: Invalid number of stores');
      process.exit(1);
    }

    if (isNaN(startingNumber) || startingNumber < 1) {
      console.error('❌ Error: Invalid starting number');
      process.exit(1);
    }

    const endNumber = startingNumber + numberOfStores - 1;
    const DEFAULT_PAYME_KASSA_ID = "PLACEHOLDER_KASSA_ID"; // UPDATE with real ID

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           Store Creation Tool                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`Creating ${numberOfStores} stores...`);
    console.log(`Range: Store #${startingNumber} to Store #${endNumber}`);
    console.log('');

    const stores = [];
    for (let i = startingNumber; i <= endNumber; i++) {
      stores.push({
        storeNumber: String(i),
        area: 0,
        description: null,
        type: 'SHOP',
        paymeKassaId: DEFAULT_PAYME_KASSA_ID,
        sortKey: i
      });
    }

    // Batch insert
    const result = await prisma.store.createMany({
      data: stores,
      skipDuplicates: true
    });

    console.log(`✓ Successfully created ${result.count} stores`);
    
    // Show which were skipped due to duplicates
    const skipped = numberOfStores - result.count;
    if (skipped > 0) {
      console.log(`⊘ Skipped ${skipped} stores (already exist)`);
    }

    // Verify total stores in database
    const totalStores = await prisma.store.count();
    console.log(`\nTotal stores in database: ${totalStores}`);

    // Show sample of created stores
    console.log('\nSample stores created:');
    const sampleStores = await prisma.store.findMany({
      where: {
        storeNumber: {
          in: [String(startingNumber), String(Math.floor((startingNumber + endNumber) / 2)), String(endNumber)]
        }
      },
      select: {
        id: true,
        storeNumber: true
      }
    });

    sampleStores.forEach(store => {
      console.log(`  Store #${store.storeNumber} (ID: ${store.id})`);
    });

    console.log('\n✓ Store creation completed!\n');

  } catch (error) {
    console.error('\n❌ Error creating stores:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createStores();
