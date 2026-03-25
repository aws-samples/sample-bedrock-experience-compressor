import serverless from 'serverless-http';
import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { extractUser } from './middleware/auth';
import tasksRouter from './handlers/tasks';
import statusRouter from './handlers/status';
import reportsRouter from './handlers/reports';
import photosRouter from './handlers/photos';

interface ApiGatewayEvent {
  requestContext?: Record<string, unknown>;
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'technician-api' });
});

app.use('/api/technician/tasks', extractUser, tasksRouter);
app.use('/api/technician/tasks', extractUser, statusRouter);
app.use('/api/technician/reports', extractUser, reportsRouter);
app.use('/api/technician/photos', extractUser, photosRouter);

export const handler = serverless(app, {
  request: (request: Request & { context?: unknown; requestContext?: unknown }, event: ApiGatewayEvent, context: unknown) => {
    request.context = context;
    request.requestContext = event.requestContext;
  },
});
