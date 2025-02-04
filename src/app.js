import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectMongo from './config/mongo.js';  // Correct the path if needed
import connection from './config/db.js';
dotenv.config({path:'./.env'});  // Load environment variables from .env
import authRoute from "./routes/authRoute.js"
const app = express();

connectMongo();  // Connect to MongoDB
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use('/api/auth',authRoute)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

