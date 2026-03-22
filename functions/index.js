const { onRequest } = require("firebase-functions/v2/https");
const app = require("./src/app");

// Firebase HTTPS function for the backend API
// Set timeout and memory for AI video generation tasks
exports.api = onRequest({
  timeoutSeconds: 540,
  memory: "1GiB",
  cors: true,
  concurrency: 80,
  cpu: 1,
  secrets: ["FAL_KEY", "OPENAI_API_KEY", "JWT_SECRET"],
}, app);
