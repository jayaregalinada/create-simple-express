import { errorHandlerMiddleware } from '#app/middleware/index.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

const app = express();

// Global middleware
app.use(bodyParser.json());
app.use(cors());

// Register Routes


// Error Handling Middleware, should always be the last
app.use(errorHandlerMiddleware);

export default app;