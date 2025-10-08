import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!

type MongoCache = {
  _mongoClient?: MongoClient
  _mongoDB?: Db
  _connectedOnce?: boolean
}

const cached = globalThis as unknown as MongoCache

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is missing.")
  if (!dbName) throw new Error("MONGODB_DB is missing.")

  if (cached._mongoDB) return cached._mongoDB

  const client = cached._mongoClient ?? new MongoClient(uri)
  if (!cached._mongoClient) {
    await client.connect()
    cached._mongoClient = client

    if (!cached._connectedOnce) {
      console.log("Connected to MongoDB successfully!")
      cached._connectedOnce = true
    }
  }

  const db = client.db(dbName)
  cached._mongoDB = db
  return db
}
