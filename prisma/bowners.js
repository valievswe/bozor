// insertOwners-Beshariq.js
// Script to insert owners for Beshariq Dehqon Bozori
// Run with: DATABASE_URL="postgresql://beshariq_user:46575116beshariq@localhost:5432/beshariq_db" node insertOwners-Beshariq.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertOwners() {
  try {
    // IMPORTANT: Replace with your actual admin user ID from Beshariq database
    const ADMIN_USER_ID = 1; // <-- UPDATE THIS VALUE

    const ownersData = [
      { fullName: "ЯТТ Назаров Салимжон Толипович", tin: "32303684180048", activityType: "Ноозик-овкат" },
      { fullName: "ЯТТ Алиева Шахноза Абдисалимовна", tin: "40309834180107", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Ғуломова Муборакхон Толибжонова", tin: "40802816930036", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Сайдахмедов Мухторжон Абдурахматович", tin: "30706654180020", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Ортиқов Хакимжон Турғунович", tin: "30903604180028", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Рахимов Улуғбек Олимович", tin: "61606714180063", activityType: "Мебел жихозлари" },
      { fullName: "ЯТТ Тўхтасинов Абдулазиз Парпиевич", tin: "30601654180048", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Турсунов Иброхимжон ХХХ", tin: "31505730250054", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Ёқубов Отабек Дехқонович", tin: "31801764180065", activityType: "Омбор" },
      { fullName: "ЯТТ Маматқулов Лазизбек Рўзиқул ўғли", tin: "31711976930038", activityType: "Мебел жихозлари" },
      { fullName: "ЯТТ Обидова Гуласал Исроиловна", tin: "42104854180016", activityType: "Хужалик моллари" },
      { fullName: "ЯТТ Бозаров Бахтиёр Охунович", tin: "32009744180060", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Абдурахманов Хусниддин Бахтиёржонович", tin: "32912844180105", activityType: "Канцилерия" },
      { fullName: "ЯТТ Акбаров Аброр Ўринбоевич", tin: "32106794180029", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Комилов Ахаджон Азамжонович", tin: "31512864180025", activityType: "Мебел жихозлари" },
      { fullName: "ЯТТ Халилова Зумрадхон Абдумаликовна", tin: "42910844180043", activityType: "Сандик" },
      { fullName: "ЯТТ Абдуллаев Мухаммадали Зафаржон ўғли", tin: "50712006930065", activityType: "Мебел жихозлари" },
      { fullName: "ЯТТ Абдураззақов Аъзамжон Абдумуталович", tin: "32107694180021", activityType: "Мебел жихозлари" },
      { fullName: "ЯТТ Абдушукуров Юсуфжон Дилмурод ўғли", tin: "32401996930035", activityType: "Бабакалот" },
      { fullName: "ЯТТ Абдусаматов Акмалжон Абдулатифович", tin: "30703764180043", activityType: "Озик-овкат мах" },
      { fullName: "ЯТТ Хамидова Феруза Эргашевна", tin: "42205764180016", activityType: "Озик-овкат мах" }
    ];

    console.log(`Starting to insert ${ownersData.length} owners for Beshariq market...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const ownerData of ownersData) {
      try {
        const owner = await prisma.owner.create({
          data: {
            fullName: ownerData.fullName,
            tin: ownerData.tin,
            activityType: ownerData.activityType,
            address: null,
            phoneNumber: null,
            isActive: true,
            createdById: ADMIN_USER_ID
          }
        });
        
        successCount++;
        console.log(`✓ Created: ${owner.fullName} (ID: ${owner.id}, TIN: ${owner.tin})`);
      } catch (error) {
        if (error.code === 'P2002') {
          skipCount++;
          console.log(`⊘ Skipped (duplicate): ${ownerData.fullName} (TIN: ${ownerData.tin})`);
        } else {
          console.error(`✗ Error inserting ${ownerData.fullName}:`, error.message);
        }
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`✓ Successfully inserted: ${successCount}`);
    console.log(`⊘ Skipped (duplicates): ${skipCount}`);
    console.log(`Total owners: ${ownersData.length}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the insertion
insertOwners();
