// insertOwners.js
// Script to insert owners from Excel file into PostgreSQL database
// Run with: node insertOwners.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertOwners() {
  try {
    // IMPORTANT: Replace createdById with your actual admin user ID from the User table
    const ADMIN_USER_ID = 1; // <-- UPDATE THIS VALUE

    const ownersData = [
      { fullName: "ЯТТ Камолова Сайёра (и-ёз)", tin: "447179168", activityType: "Гул сотиш" },
      { fullName: "Шухрат-Маъмуржон ОК", tin: "307711953", activityType: "Озик-овқат сотиш" },
      { fullName: "ЯТТ Умаров Достонбек", tin: "622258662", activityType: "Уй-рўзғор бую-ри" },
      { fullName: "Абдулбоки Мадина ОК", tin: "307190047", activityType: "Озик-овқат сотиш" },
      { fullName: "Юлдашев Иқболжон  ЯТТ", tin: "31010806910027", activityType: "Озик-овқат" },
      { fullName: "Шербоев Ойбек Зам-Зам ўғли", tin: "31401854160023", activityType: "Озик-овқат" },
      { fullName: "ЯТТ Ахмадалиев Ахмаджон", tin: "401789689", activityType: "Ветеранирия" },
      { fullName: "ЯТТ Тиркашев Адхамжон", tin: "502873101", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Жабборова Дилдора", tin: "564777703", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Ахмедов Жамолдин", tin: "30305814160023", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Хомиджонова Шахноза", tin: "591708988", activityType: "Ноозиқ овқат сот-ш" },
      { fullName: "ЯТТ Акбаров Аброр", tin: "587048408", activityType: "Миллий таомлар" },
      { fullName: "Исаков Давлатжон 1", tin: "309695750", activityType: "Омборхона" },
      { fullName: "Абдурасулова Хайринисо (50%)", tin: "41903764160014", activityType: "Туникасоз" },
      { fullName: "ЯТТ Тожиев  Умиджон", tin: "30312824160073", activityType: "КХМ савдо қилиш" },
      { fullName: "ЯТТ Мамадалиев Камолдин", tin: "33001816910019", activityType: "Омборхона" },
      { fullName: "Абдураимов Исмоилжон (50%)", tin: "41763220248  691001822", activityType: "Омборхона" },
      { fullName: "ЯТТ Ходжаев Муроджон", tin: "30411684160026", activityType: "Миллий таомлар" },
      { fullName: "ЯТТ Жўраев Муроджон", tin: "601647316", activityType: "Атторлик моллари" },
      { fullName: "ЯТТ Мамадолимова Санобар", tin: "41607894160042", activityType: "Салқин ичимликлар с" },
      { fullName: "ЯТТ Ахмедов Файзулло", tin: "30608856910015", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Омонов Абдулазиз", tin: "31005924160021", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Рўзиматов Илёсбек", tin: "32712926910011", activityType: "Озиқ ва ноозиқ-овкат сотиш" },
      { fullName: "ЯТТ Азизов Бахромжон", tin: "600525064", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Best Karvon Market MЧЖ", tin: "309719703", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Дехқонова Манзура", tin: "42806704160019", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Мухаммадалиева Фозила", tin: "62104036910015", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Маматқулов Сохибжон", tin: "600735326", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Мамажонов Охунжон", tin: "32905914160040", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Неъматова Шахлохон", tin: "41711977050088", activityType: "Озиқ-овкат ва ноозиқ" },
      { fullName: "ЯТТ Абдувалиева Мавжуда", tin: "513951254", activityType: "Ноозиқ-овкат" },
      { fullName: "ЯТТ Арслонов Мирхожиддин", tin: "447281485", activityType: "Маиший-хизмат" },
      { fullName: "ЎЎБ. Сулаймонова Нигора", tin: "42405824170069", activityType: "Миллий ширинлик" },
      { fullName: "Мирзаабдуллаев Аслиддин", tin: "31809954160039", activityType: "Озиқ-овкат сотиш" },
      { fullName: "\"Водий мобил\" ХК", tin: "303126544", activityType: "Уяли-алоқа хизмати" },
      { fullName: "Фарходжон Илхомжон ХК", tin: "602827313", activityType: "Уяли-алоқа хизмати" },
      { fullName: "ЯТТ Ғиёсова Махлиёхон", tin: "603390419", activityType: "Ноозиқ-овкат" },
      { fullName: "Исомиддионова Мафтуна", tin: "42412904160029", activityType: "Кишлок хужалик мах" },
      { fullName: "Одилов Ғайратжон", tin: "32111894160035", activityType: "Озик-овкат ва  ноозиқ овқат сотиш" },
      { fullName: "Carvon produkt ОК", tin: "307869320", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Мирзарахматов Козим", tin: "30912986910033", activityType: "Миллий таомлар сo-ш" },
      { fullName: "ЯТТ Мирсаидова Мавжуда", tin: "41011724160038", activityType: "Миллий таомлар сo-ш" },
      { fullName: "ЯТТ Қосимова Гулнора", tin: "42006714160018", activityType: "Миллий таомлар сo-ш" },
      { fullName: "Камолов Умарали", tin: "32510604160062", activityType: "Миллий таомлар сo-ш" },
      { fullName: "ЯТТ Содиков Мирмухсин", tin: "545231895", activityType: "Миллий таомлар сo-ш" },
      { fullName: "Жўраев Акрам", tin: "32312754160048", activityType: "Миллий таом сотиш" },
      { fullName: "Саидумаров Хусанхон Аб-он", tin: "31802954160045", activityType: "Миллий таом сотиш" },
      { fullName: "ЯТТ Исомиддинова Мазмуна", tin: "617066089", activityType: "Ноозиқ-овкат соиш" },
      { fullName: "ЯТТ Тешабоев Фарход (Феруза)", tin: "31102834160106", activityType: "Миллий таом сотиш" },
      { fullName: "ЯТТ Расулов Улугбек", tin: "32708824160050", activityType: "Миллий таом сотиш" },
      { fullName: "Эркаева Мухаббат", tin: "42503684160050", activityType: "Миллий таом сотиш" },
      { fullName: "ЯТТ Сатторов Фарход", tin: "31012734160048", activityType: "Миллий таом сотиш" },
      { fullName: "ЯТТ Акбаров Отабек", tin: "31001824160073", activityType: "Миллий таом сотиш" },
      { fullName: "ЯТТ Қосимов Фарход", tin: "31207864160040", activityType: "Миллий таом сотиш" },
      { fullName: "Юнусалиев Уктамжон Юсуф-н уг", tin: "52106036910029", activityType: "Миллийй таом сотиш" },
      { fullName: "Ўринов Алишер", tin: "541965860", activityType: "Омборхона" },
      { fullName: "ЯТТ Тешаев Хасан", tin: "486693752", activityType: "Гўшт сотиш" },
      { fullName: "Bagdod The Best Taomlari ХК", tin: "309098758", activityType: "Миллий таомлар" },
      { fullName: "ЯТТ Пайғамбарқулов Обобакир (50%)", tin: "30301754160066", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Рахмату-ев Омонбек (Замира) (50%)", tin: "Мал. №097014", activityType: "Омборхона" },
      { fullName: "ЯТТ Тошматов Муроджон", tin: "476276365", activityType: "Миллий Ширинлик" },
      { fullName: "ЯТТ Топиболдиев Гайратжон", tin: "424677938", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Хусаинова Вилоят", tin: "41808866910014", activityType: "Озиқ-овкат сотиш" },
      { fullName: "ЯТТ Хўжамқулова Шахринса", tin: "42508724160085", activityType: "Озиқ ва ноозиқ-овкат сотиш" },
      { fullName: "ЯТТ Сулаймонов Фарход", tin: "30905836910015", activityType: "Миллий таом сотиш" },
      { fullName: "ЯТТ Алиев Вохиджон", tin: "538496789", activityType: "Мебел сотиш" },
      { fullName: "Умаров Зафаржон", tin: "41101714160011", activityType: "Омборхона" },
      { fullName: "Эркаева Солияхон", tin: "31707914160072", activityType: "Омборхона" },
      { fullName: "Ғиёссиддинов Зармастжон", tin: "30708914160089", activityType: "Эски темир-омбор" },
      { fullName: "Турдиматов Муроджон (Дўрмонча)", tin: "43004744160016", activityType: "Озиқ-овкат сотиш" },
      { fullName: "Турдиматов Мухамадали (дўрмонча)", tin: "32108794160052", activityType: "Миллий таом сотиш" }
    ];

    console.log(`Starting to insert ${ownersData.length} owners...\n`);

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
    console.log(`✗ Total owners: ${ownersData.length}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the insertion
insertOwners();
