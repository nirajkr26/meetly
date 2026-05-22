import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());


app.use("/api", apiRouter);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});


app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
