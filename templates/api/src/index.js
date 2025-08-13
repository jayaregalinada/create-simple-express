import { errorHandlerMiddleware } from '#app/middleware/index.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import authRoutes from '#app/routes/auth.js';

const app = express();

// Global middleware
app.use(bodyParser.json());
app.use(cors());

// Register Routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'PONG'
  });
});

app.use('/auth', authRoutes);

app.get('/error', (req, res) => {
  throw new Error('Something went wrong');
});

// Error Handling Middleware, should always be the last
app.use(errorHandlerMiddleware);

export default app;