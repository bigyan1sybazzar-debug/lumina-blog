import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateInsightsRoute from './api/generate-insights';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(express.json());

// Register the route
app.use('/api/generate-insights', generateInsightsRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
