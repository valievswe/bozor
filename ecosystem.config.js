module.exports = {
  apps: [
    {
      name: 'API-myrent',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'API-rizq-baraka',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3003, // A new, unique port for this tenant
        DATABASE_URL: "postgresql://u2:13242003@localhost:5432/rizq_baraka",
        JWT_SECRET: "MYRENTRIZQBARAKAJWT09",
      },
    },
  ],
};
