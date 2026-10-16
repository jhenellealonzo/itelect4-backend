import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | null = null;

export function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and fill it in.");
  }

  if (connection === null) {
    connection = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((mongooseInstance) => {
        console.log("MongoDB connected:", mongooseInstance.connection.name);
        return mongooseInstance;
      })
      .catch((error: unknown) => {
        connection = null;
        throw error;
      });
  }

  return connection;
}
