module.exports = {
  apps: [
    {
      name: "API-myrent",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DATABASE_URL: "postgresql://bozor_admin:46575116@localhost:5432/bozor",
        JWT_SECRET: "4657511613242003DIGITALBOZOR",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "myrent.uz",
        TENANT_ID: "ipak_yuli",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },
    {
      name: "API-rizq-baraka",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
        DATABASE_URL: "postgresql://u2:13242003@localhost:5432/rizq_baraka",
        JWT_SECRET: "MYRENTRIZQBARAKAJWT09",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "rizq-baraka.myrent.uz",
        TENANT_ID: "rizq_baraka",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },
    {
      name: "API-muzaffar-savdo",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3004,
        DATABASE_URL:
          "postgresql://muzaffar_user:MuzSavdo_Pass_789!@localhost:5432/muzaffar_savdo_db",
        JWT_SECRET: "MUZAFFARSAVDOJWT09",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "muzaffar-savdo.myrent.uz",
        TENANT_ID: "muzaffar-savdo",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },
    {
      name: "API-istiqlol",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
        DATABASE_URL:
          "postgresql://istiqlol_user:istiqlol46575116@localhost:5432/istiqlol_db",
        JWT_SECRET: "ISTIQLOLJWT09",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "istiqlol.myrent.uz",
        TENANT_ID: "istiqlol",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },
    {
      name: "API-bogdod",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3006,
        DATABASE_URL:
          "postgresql://bogdod_user:bogdod46575116@localhost:5432/bogdod_db",
        JWT_SECRET: "BOGDODJWT09",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "bogdod.myrent.uz",
        TENANT_ID: "bogdod",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },

    {
      name: "API-Beshariq-turon",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3007,
        DATABASE_URL:
          "postgresql://beshariq_turon_user:46575116turon@localhost:5432/beshariq_turon_db",
        JWT_SECRET: "TURONJWT09",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "beshariq-turon.myrent.uz",
        TENANT_ID: "beshariq-turon",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },
    {
      name: "API-Beshariq",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3009,
        DATABASE_URL:
          "postgresql://beshariq_user:46575116beshariq@localhost:5432/beshariq_db",
        JWT_SECRET: "BESHARIQJWT09",
        WEBHOOK_SECRET_KEY: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
        MY_DOMAIN: "beshariq.myrent.uz",
        TENANT_ID: "beshariq",
        CENTRAL_PAYMENT_SERVICE_URL: "https://myrent.uz/api/v1",
        CENTRAL_PAYMENT_SERVICE_SECRET: "MyRent_MainSecretKey_h7Kz$9pX!q@w#eR",
      },
    },
  ],
};
