// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("--- Seeding started ---");

  // 1. Create Roles
  const roleAdmin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Full system access" },
  });
  const roleCashier = await prisma.role.upsert({
    where: { name: "CASHIER" },
    update: {},
    create: { name: "CASHIER", description: "Manages transactions" },
  });
  const roleAccountant = await prisma.role.upsert({
    where: { name: "ACCOUNTANT" },
    update: {},
    create: { name: "ACCOUNTANT", description: "Views financial data" },
  });

  // 2. Create Permissions (Deduplicated and Complete List)
  const permissionsData = [
    // User & Role Management
    {
      action: "MANAGE_USERS",
      description: "Can create, edit, and delete users",
    },
    {
      action: "MANAGE_ROLES",
      description: "Can manage roles and their permissions",
    },
    // Owner Management
    { action: "CREATE_OWNER", description: "Can create new owners" },
    { action: "VIEW_OWNERS", description: "Can view owner list and details" },
    { action: "EDIT_OWNER", description: "Can edit owner details" },
    { action: "DELETE_OWNER", description: "Can delete an owner" },
    // Store Management
    { action: "CREATE_STORE", description: "Can create new stores" },
    { action: "VIEW_STORES", description: "Can view store list and details" },
    { action: "EDIT_STORE", description: "Can edit store details" },
    { action: "DELETE_STORE", description: "Can delete a store" },
    // Stall Management
    { action: "CREATE_STALL", description: "Can create new stalls" },
    { action: "VIEW_STALLS", description: "Can view stall list and details" },
    { action: "EDIT_STALL", description: "Can edit stall details" },
    { action: "DELETE_STALL", description: "Can delete a stall" },
    // Lease Management
    { action: "CREATE_LEASE", description: "Can create new leases" },
    { action: "VIEW_LEASES", description: "Can view lease list and details" },
    { action: "EDIT_LEASE", description: "Can edit lease details" },
    { action: "DEACTIVATE_LEASE", description: "Can deactivate a lease" },
    // Transaction & Reporting
    {
      action: "CREATE_TRANSACTION",
      description: "Can manually initiate a transaction",
    },
    {
      action: "VIEW_TRANSACTIONS",
      description: "Can view transaction history",
    },
    { action: "VIEW_REPORTS", description: "Can view financial reports" },
  ];

  for (const pData of permissionsData) {
    await prisma.permission.upsert({
      where: { action: pData.action },
      update: { description: pData.description },
      create: pData,
    });
  }

  // 3. Assign Permissions to Roles
  const allPermissions = await prisma.permission.findMany();
  const permissionsMap = new Map(allPermissions.map((p) => [p.action, p.id]));

  // Admin gets all permissions
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAdmin.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: { roleId: roleAdmin.id, permissionId: permission.id },
    });
  }

  // Cashier permissions
  const cashierPermissions = [
    "VIEW_OWNERS",
    "VIEW_STORES",
    "VIEW_STALLS",
    "VIEW_LEASES",
    "CREATE_TRANSACTION",
    "VIEW_TRANSACTIONS",
  ];
  for (const action of cashierPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleCashier.id,
          permissionId: permissionsMap.get(action),
        },
      },
      update: {},
      create: {
        roleId: roleCashier.id,
        permissionId: permissionsMap.get(action),
      },
    });
  }

  // Accountant permissions
  const accountantPermissions = [
    "VIEW_OWNERS",
    "VIEW_STORES",
    "VIEW_STALLS",
    "VIEW_LEASES",
    "VIEW_TRANSACTIONS",
    "VIEW_REPORTS",
  ];
  for (const action of accountantPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAccountant.id,
          permissionId: permissionsMap.get(action),
        },
      },
      update: {},
      create: {
        roleId: roleAccountant.id,
        permissionId: permissionsMap.get(action),
      },
    });
  }

  // 4. Create Admin User
  const hashedPassword = await bcrypt.hash("superadmin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      roleId: roleAdmin.id,
    },
  });

  console.log("--- Seeding finished successfully ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
