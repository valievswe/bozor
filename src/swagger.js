// src/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Myrent API Documentation",
      version: "1.0.0",
      description: "REST API documentation for Myrent backend services",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Local server",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Adjust if routes are elsewhere
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📘 Swagger docs available at: http://localhost:3000/api-docs");
}

module.exports = setupSwagger;
