import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { extractUser } from './middleware/auth.js';
import tasksRouter from './handlers/tasks.js';
import statusRouter from './handlers/status.js';
import reportsRouter from './handlers/reports.js';
import photosRouter from './handlers/photos.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000'
  ],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'technician-api' });
});

// Protected routes
app.use('/api/technician/tasks', extractUser, tasksRouter);
app.use('/api/technician/tasks', extractUser, statusRouter);
app.use('/api/technician/reports', extractUser, reportsRouter);
app.use('/api/technician/photos', extractUser, photosRouter);

app.listen(PORT, () => {
  console.log(`Technician API running on port ${PORT}`);
});
