// leaseData.js
// Parsed lease data from Excel file
// This shows the relationship between owners and their stores
// Note: Store numbers like "4-5" means the owner has BOTH store 4 AND store 5

/*
 * HOW TO USE THIS FILE:
 * 
 * 1. Run insertOwners.js to insert all owners
 * 2. Run insertStores.js to create 500 empty stores
 * 3. Query database to get owner IDs by TIN
 * 4. Create lease records using the mappings below
 * 5. For entries with multiple stores (e.g., "4-5"), create separate lease records for each store
 */

const leaseData = [
  {
    row: 1,
    ownerTIN: "447179168",
    ownerName: "ЯТТ Камолова Сайёра (и-ёз)",
    storeNumbers: [1], // Single store
    contractNumber: "1",
    totalArea: 54,
    debt: 0,
    monthlyFee: 405000,
    activity: "Гул сотиш"
  },
  {
    row: 2,
    ownerTIN: "307711953",
    ownerName: "Шухрат-Маъмуржон ОК",
    storeNumbers: [2],
    contractNumber: "2",
    totalArea: 0,
    debt: 0,
    monthlyFee: null,
    activity: null
  },
  {
    row: 3,
    ownerTIN: "307711953",
    ownerName: "Шухрат-Маъмуржон ОК",
    storeNumbers: [3],
    contractNumber: "3",
    totalArea: 108,
    debt: 1249500,
    monthlyFee: 1620000,
    activity: "Озик-овқат сотиш"
  },
  {
    row: 4,
    ownerTIN: "622258662",
    ownerName: "ЯТТ Умаров Достонбек",
    storeNumbers: [4, 5], // Multiple stores: 4 AND 5
    contractNumber: "4",
    totalArea: 108,
    debt: 4963500,
    monthlyFee: 1620000,
    activity: "Уй-рўзғор бую-ри"
  },
  {
    row: 5,
    ownerTIN: "307190047",
    ownerName: "Абдулбоки Мадина ОК",
    storeNumbers: [6, 7], // Stores 6 AND 7
    contractNumber: "5",
    totalArea: 97,
    debt: 5070000,
    monthlyFee: 710000,
    activity: "Озик-овқат сотиш"
  },
  {
    row: 6,
    ownerTIN: "31010806910027",
    ownerName: "Юлдашев Иқболжон  ЯТТ",
    storeNumbers: [8],
    contractNumber: "6",
    totalArea: 78,
    debt: 0,
    monthlyFee: 1170000,
    activity: "Озик-овқат"
  },
  {
    row: 7,
    ownerTIN: "31401854160023",
    ownerName: "Шербоев Ойбек Зам-Зам ўғли",
    storeNumbers: [9],
    contractNumber: "7",
    totalArea: 54,
    debt: 0,
    monthlyFee: 810000,
    activity: "Озик-овқат"
  },
  {
    row: 8,
    ownerTIN: "401789689",
    ownerName: "ЯТТ Ахмадалиев Ахмаджон",
    storeNumbers: [10],
    contractNumber: "8",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Ветеранирия"
  },
  {
    row: 9,
    ownerTIN: "502873101",
    ownerName: "ЯТТ Тиркашев Адхамжон",
    storeNumbers: [11],
    contractNumber: "9",
    totalArea: 48,
    debt: 0,
    monthlyFee: 720000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 10,
    ownerTIN: "564777703",
    ownerName: "ЯТТ Жабборова Дилдора",
    storeNumbers: [12, 13], // Stores 12 AND 13
    contractNumber: "10",
    totalArea: 48,
    debt: 0,
    monthlyFee: 750000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 11,
    ownerTIN: "30305814160023",
    ownerName: "ЯТТ Ахмедов Жамолдин",
    storeNumbers: [25, 14], // Stores 25 AND 14 (note the order from Excel: "25-14")
    contractNumber: "11",
    totalArea: 102,
    debt: 0,
    monthlyFee: 1800000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 12,
    ownerTIN: "591708988",
    ownerName: "Хомиджонова Шахноза",
    storeNumbers: [15],
    contractNumber: "12",
    totalArea: 40,
    debt: 222000,
    monthlyFee: 622000,
    activity: "Ноозиқ овқат сот-ш"
  },
  {
    row: 13,
    ownerTIN: "587048408",
    ownerName: "ЯТТ Акбаров Аброр",
    storeNumbers: [16],
    contractNumber: "13",
    totalArea: 40,
    debt: 0,
    monthlyFee: 735000,
    activity: "Миллий таомлар"
  },
  {
    row: 14,
    ownerTIN: "309695750",
    ownerName: "Исаков Давлатжон 1",
    storeNumbers: [17],
    contractNumber: "14",
    totalArea: 42,
    debt: 0,
    monthlyFee: 630000,
    activity: "Омборхона"
  },
  {
    row: 15,
    ownerTIN: "30411684160026",
    ownerName: "ЯТТ Ходжаев Муроджон",
    storeNumbers: [18],
    contractNumber: "15",
    totalArea: 25,
    debt: 0,
    monthlyFee: 375000,
    activity: "Миллий таомлар"
  },
  {
    row: 16,
    ownerTIN: "41903764160014",
    ownerName: "Абдурасулова Хайринисо (50%)",
    storeNumbers: [19],
    contractNumber: "16",
    totalArea: 54,
    debt: 0,
    monthlyFee: 810000,
    activity: "Туникасоз"
  },
  {
    row: 17,
    ownerTIN: "30312824160073",
    ownerName: "ЯТТ Тожиев  Умиджон",
    storeNumbers: [20],
    contractNumber: "17",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "КХМ савдо қилиш"
  },
  {
    row: 18,
    ownerTIN: "33001816910019",
    ownerName: "ЯТТ Мамадалиев Камолдин",
    storeNumbers: [21],
    contractNumber: "18",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Омборхона"
  },
  {
    row: 19,
    ownerTIN: "41763220248  691001822",
    ownerName: "Абдураимов Исмоилжон (50%)",
    storeNumbers: [22],
    contractNumber: "19",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Омборхона"
  },
  {
    row: 20,
    ownerTIN: "30411684160026",
    ownerName: "ЯТТ Ходжаев Муроджон",
    storeNumbers: [23],
    contractNumber: "20",
    totalArea: 48,
    debt: 0,
    monthlyFee: 720000,
    activity: "Миллий таомлар"
  },
  {
    row: 21,
    ownerTIN: "601647316",
    ownerName: "ЯТТ Жўраев Муроджон",
    storeNumbers: [24],
    contractNumber: "21",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Атторлик моллари"
  },
  {
    row: 22,
    ownerTIN: "41607894160042",
    ownerName: "ЯТТ Мамадолимова Санобар",
    storeNumbers: [26],
    contractNumber: "23",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "Салқин ичимликлар с"
  },
  {
    row: 23,
    ownerTIN: "30608856910015",
    ownerName: "ЯТТ Ахмедов Файзулло",
    storeNumbers: [27],
    contractNumber: "24",
    totalArea: 35,
    debt: 0,
    monthlyFee: 525000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 24,
    ownerTIN: "31005924160021",
    ownerName: "ЯТТ Омонов Абдулазиз",
    storeNumbers: [28],
    contractNumber: "25",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 25,
    ownerTIN: "32712926910011",
    ownerName: "Рўзиматов Илёсбек",
    storeNumbers: [29],
    contractNumber: "26",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Озиқ ва ноозиқ-овкат сотиш"
  },
  {
    row: 26,
    ownerTIN: "600525064",
    ownerName: "ЯТТ Азизов Бахромжон",
    storeNumbers: [30],
    contractNumber: "27",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 27,
    ownerTIN: "309719703",
    ownerName: "Best Karvon Market MЧЖ",
    storeNumbers: [31, 32], // Stores 31 AND 32
    contractNumber: "28",
    totalArea: 60,
    debt: 0,
    monthlyFee: 900000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 28,
    ownerTIN: "62104036910015",
    ownerName: "Мухаммадалиева Фозила",
    storeNumbers: [34],
    contractNumber: "30",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 29,
    ownerTIN: "600735326",
    ownerName: "ЯТТ Маматқулов Сохибжон",
    storeNumbers: [35],
    contractNumber: "31",
    totalArea: 35,
    debt: 0,
    monthlyFee: 525000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 30,
    ownerTIN: "32905914160040",
    ownerName: "ЯТТ Мамажонов Охунжон",
    storeNumbers: [36],
    contractNumber: "32",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 31,
    ownerTIN: "41711977050088",
    ownerName: "Неъматова Шахлохон",
    storeNumbers: [37],
    contractNumber: "33",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Озиқ-овкат ва ноозиқ"
  },
  {
    row: 32,
    ownerTIN: "513951254",
    ownerName: "ЯТТ Абдувалиева Мавжуда",
    storeNumbers: [38],
    contractNumber: "34",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "Ноозиқ-овкат"
  },
  {
    row: 33,
    ownerTIN: "42806704160019",
    ownerName: "Дехқонова Манзура",
    storeNumbers: [39],
    contractNumber: "35",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 34,
    ownerTIN: "42405824170069",
    ownerName: "ЎЎБ. Сулаймонова Нигора",
    storeNumbers: [40],
    contractNumber: "36",
    totalArea: 16,
    debt: 0,
    monthlyFee: 240000,
    activity: "Миллий ширинлик"
  },
  {
    row: 35,
    ownerTIN: "31809954160039",
    ownerName: "Мирзаабдуллаев Аслиддин",
    storeNumbers: [41],
    contractNumber: "37",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 36,
    ownerTIN: "303126544",
    ownerName: '"Водий мобил" ХК',
    storeNumbers: [42],
    contractNumber: "38",
    totalArea: 16,
    debt: 0,
    monthlyFee: 240000,
    activity: "Уяли-алоқа хизмати"
  },
  {
    row: 37,
    ownerTIN: "602827313",
    ownerName: "Фарходжон Илхомжон ХК",
    storeNumbers: [43],
    contractNumber: "39",
    totalArea: 14,
    debt: 0,
    monthlyFee: 210000,
    activity: "Уяли-алоқа хизмати"
  },
  {
    row: 38,
    ownerTIN: "603390419",
    ownerName: "ЯТТ Ғиёсова Махлиёхон",
    storeNumbers: [44],
    contractNumber: "40",
    totalArea: 22,
    debt: 0,
    monthlyFee: 330000,
    activity: "Ноозиқ-овкат"
  },
  {
    row: 39,
    ownerTIN: "42412904160029",
    ownerName: "Исомиддионова Мафтуна",
    storeNumbers: [45],
    contractNumber: "41",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "Кишлок хужалик мах"
  },
  {
    row: 40,
    ownerTIN: "32111894160035",
    ownerName: "Одилов Ғайратжон",
    storeNumbers: [46, 69], // Stores 46 AND 69
    contractNumber: "42",
    totalArea: 70,
    debt: 0,
    monthlyFee: 1050000,
    activity: "Озик-овкат ва  ноозиқ овқат сотиш"
  },
  {
    row: 41,
    ownerTIN: "307869320",
    ownerName: "Carvon produkt ОК",
    storeNumbers: [47, 48], // Stores 47 AND 48
    contractNumber: "43",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 42,
    ownerTIN: "30912986910033",
    ownerName: "ЯТТ Мирзарахматов Козим",
    storeNumbers: [49],
    contractNumber: "44",
    totalArea: 60,
    debt: 0,
    monthlyFee: 900000,
    activity: "Миллий таомлар сo-ш"
  },
  {
    row: 43,
    ownerTIN: "41011724160038",
    ownerName: "ЯТТ Мирсаидова Мавжуда",
    storeNumbers: [50],
    contractNumber: "45",
    totalArea: 59,
    debt: 0,
    monthlyFee: 885000,
    activity: "Миллий таомлар сo-ш"
  },
  {
    row: 44,
    ownerTIN: "42006714160018",
    ownerName: "ЯТТ Қосимова Гулнора",
    storeNumbers: [51],
    contractNumber: "46",
    totalArea: 59,
    debt: 0,
    monthlyFee: 885000,
    activity: "Миллий таомлар сo-ш"
  },
  {
    row: 45,
    ownerTIN: "32510604160062",
    ownerName: "Камолов Умарали",
    storeNumbers: [52, 55], // Stores 52 AND 55 (note: "52-55" in Excel)
    contractNumber: "47",
    totalArea: 98,
    debt: 0,
    monthlyFee: 1470000,
    activity: "Миллий таомлар сo-ш"
  },
  {
    row: 46,
    ownerTIN: "545231895",
    ownerName: "ЯТТ Содиков Мирмухсин",
    storeNumbers: [53],
    contractNumber: "48",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Миллий таомлар сo-ш"
  },
  {
    row: 47,
    ownerTIN: "32312754160048",
    ownerName: "Жўраев Акрам",
    storeNumbers: [54],
    contractNumber: "49",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 48,
    ownerTIN: "31802954160045",
    ownerName: "Саидумаров Хусанхон Аб-он",
    storeNumbers: [56],
    contractNumber: "51",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 49,
    ownerTIN: "32708824160050",
    ownerName: "ЯТТ Расулов Улугбек",
    storeNumbers: [57],
    contractNumber: "52",
    totalArea: 138,
    debt: 0,
    monthlyFee: 2070000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 50,
    ownerTIN: "617066089",
    ownerName: "ЯТТ Исомиддинова Мазмуна",
    storeNumbers: [58],
    contractNumber: "53",
    totalArea: 30,
    debt: 456000,
    monthlyFee: 450000,
    activity: "Ноозиқ-овкат соиш"
  },
  {
    row: 51,
    ownerTIN: "617066089",
    ownerName: "ЯТТ Исомиддинова Мазмуна",
    storeNumbers: [59],
    contractNumber: "54",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Ноозиқ-овкат соиш"
  },
  {
    row: 52,
    ownerTIN: "31102834160106",
    ownerName: "ЯТТ Тешабоев Фарход (Феруза)",
    storeNumbers: [60, 61, 62], // Stores 60, 61, AND 62
    contractNumber: "55",
    totalArea: 90,
    debt: 0,
    monthlyFee: 1350000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 53,
    ownerTIN: "42503684160050",
    ownerName: "Эркаева Мухаббат",
    storeNumbers: [63],
    contractNumber: "58",
    totalArea: 60,
    debt: 0,
    monthlyFee: 900000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 54,
    ownerTIN: "31012734160048",
    ownerName: "ЯТТ Сатторов Фарход",
    storeNumbers: [64],
    contractNumber: "59",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 55,
    ownerTIN: "31001824160073",
    ownerName: "ЯТТ Акбаров Отабек",
    storeNumbers: [65],
    contractNumber: "60",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 56,
    ownerTIN: "31207864160040",
    ownerName: "ЯТТ Қосимов Фарход",
    storeNumbers: [66, 67], // Stores 66 AND 67
    contractNumber: "61",
    totalArea: 65,
    debt: 0,
    monthlyFee: 975000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 57,
    ownerTIN: "31207864160040",
    ownerName: "ЯТТ Қосимов Фарход",
    storeNumbers: [68],
    contractNumber: "62",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 58,
    ownerTIN: "52106036910029",
    ownerName: "Юнусалиев Уктамжон Юсуф-н уг",
    storeNumbers: [70],
    contractNumber: "65",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Миллийй таом сотиш"
  },
  {
    row: 59,
    ownerTIN: "541965860",
    ownerName: "Ўринов Алишер",
    storeNumbers: [71],
    contractNumber: "66",
    totalArea: 12,
    debt: 0,
    monthlyFee: 180000,
    activity: "Омборхона"
  },
  {
    row: 60,
    ownerTIN: "486693752",
    ownerName: "ЯТТ Тешаев Хасан",
    storeNumbers: [72],
    contractNumber: "67",
    totalArea: 12,
    debt: 0,
    monthlyFee: 180000,
    activity: "Гўшт сотиш"
  },
  {
    row: 61,
    ownerTIN: "309098758",
    ownerName: "Bagdod The Best Taomlari ХК",
    storeNumbers: [73, 74], // Stores 73 AND 74
    contractNumber: "68",
    totalArea: 60,
    debt: 0,
    monthlyFee: 900000,
    activity: "Миллий таомлар"
  },
  {
    row: 62,
    ownerTIN: "30301754160066",
    ownerName: "ЯТТ Пайғамбарқулов Обобакир (50%)",
    storeNumbers: [75],
    contractNumber: "70",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 63,
    ownerTIN: "Мал. №097014",
    ownerName: "Рахмату-ев Омонбек (Замира) (50%)",
    storeNumbers: [76],
    contractNumber: "71",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Омборхона"
  },
  {
    row: 64,
    ownerTIN: "476276365",
    ownerName: "ЯТТ Тошматов Муроджон",
    storeNumbers: [77],
    contractNumber: "72",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Миллий Ширинлик"
  },
  {
    row: 65,
    ownerTIN: "424677938",
    ownerName: "ЯТТ Топиболдиев Гайратжон",
    storeNumbers: [78],
    contractNumber: "73",
    totalArea: 30,
    debt: 0,
    monthlyFee: 450000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 66,
    ownerTIN: "41808866910014",
    ownerName: "ЯТТ Хусаинова Вилоят",
    storeNumbers: [79],
    contractNumber: "74",
    totalArea: 15,
    debt: 0,
    monthlyFee: 225000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 67,
    ownerTIN: "42508724160085",
    ownerName: "ЯТТ Хўжамқулова Шахринса",
    storeNumbers: [80, 81], // Stores 80 AND 81
    contractNumber: "75",
    totalArea: 60,
    debt: 0,
    monthlyFee: 900000,
    activity: "Озиқ ва ноозиқ-овкат сотиш"
  },
  {
    row: 68,
    ownerTIN: "30905836910015",
    ownerName: "ЯТТ Сулаймонов Фарход",
    storeNumbers: [82],
    contractNumber: "77",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 69,
    ownerTIN: "538496789",
    ownerName: "ЯТТ Алиев Вохиджон",
    storeNumbers: [83],
    contractNumber: "78",
    totalArea: 40,
    debt: 0,
    monthlyFee: 600000,
    activity: "Мебел сотиш"
  },
  {
    row: 70,
    ownerTIN: "41101714160011",
    ownerName: "Умаров Зафаржон",
    storeNumbers: [84],
    contractNumber: "79",
    totalArea: 47,
    debt: 0,
    monthlyFee: 705000,
    activity: "Омборхона"
  },
  {
    row: 71,
    ownerTIN: "31707914160072",
    ownerName: "Эркаева Солияхон",
    storeNumbers: [85],
    contractNumber: "80",
    totalArea: 13,
    debt: 0,
    monthlyFee: 195000,
    activity: "Омборхона"
  },
  {
    row: 72,
    ownerTIN: "30708914160089",
    ownerName: "Ғиёссиддинов Зармастжон",
    storeNumbers: [86],
    contractNumber: "81",
    totalArea: 12,
    debt: 0,
    monthlyFee: 180000,
    activity: "Эски темир-омбор"
  },
  {
    row: 73,
    ownerTIN: "43004744160016",
    ownerName: "Турдиматов Муроджон (Дўрмонча)",
    storeNumbers: [87],
    contractNumber: "82",
    totalArea: 67,
    debt: 0,
    monthlyFee: 1005000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 74,
    ownerTIN: "43004744160016",
    ownerName: "Турдиматов Муроджон (Дўрмонча)",
    storeNumbers: [88],
    contractNumber: "83",
    totalArea: 20,
    debt: 0,
    monthlyFee: 300000,
    activity: "Озиқ-овкат сотиш"
  },
  {
    row: 75,
    ownerTIN: "43004744160016",
    ownerName: "Турдиматов Муроджон (Дўрмонча)",
    storeNumbers: [89],
    contractNumber: "84",
    totalArea: 22,
    debt: 0,
    monthlyFee: 330000,
    activity: "Омборхона"
  },
  {
    row: 76,
    ownerTIN: "32108794160052",
    ownerName: "Турдиматов Мухамадали (дўрмонча)",
    storeNumbers: [90],
    contractNumber: "85",
    totalArea: 67,
    debt: 0,
    monthlyFee: 1005000,
    activity: "Миллий таом сотиш"
  },
  {
    row: 77,
    ownerTIN: "447281485",
    ownerName: "ЯТТ Арслонов Мирхожиддин",
    storeNumbers: [92],
    contractNumber: "88",
    totalArea: 27,
    debt: 0,
    monthlyFee: 405000,
    activity: "Маиший хизмат"
  }
];

module.exports = { leaseData };

/*
 * SUMMARY:
 * - Total rows: 77
 * - Total unique owners: 71
 * - Total individual stores occupied: ~90 stores
 * - Some owners have multiple stores
 * - Some owners appear multiple times with different stores/contracts
 * 
 * NEXT STEPS:
 * 1. Insert all 71 owners using insertOwners.js
 * 2. Insert 500 stores using insertStores.js
 * 3. Create a script to insert leases based on this data
 */
