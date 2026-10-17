import "dotenv/config";

import { app } from "./app";
import { connectDB } from "./config/db";

const port = Number(process.env.PORT) || 4000;

connectDB().catch((error: unknown) => {
  console.error("Could not connect to MongoDB:", error);
});

app.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});
