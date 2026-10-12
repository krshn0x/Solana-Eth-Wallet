const { createApp } = require("./app");
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "127.0.0.1";
createApp({ serveFrontend: process.env.NODE_ENV === "production" }).listen(
  PORT,
  HOST,
  () => console.log(`SolVault running at http://${HOST}:${PORT}`),
);
