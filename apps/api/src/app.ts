import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './shared/logger';
import gamesRouter from './modules/games/games.routes';

const app: Express = express();

app.use(helmet());
app.use(cors({
  origin: '*', // Di production ganti dengan domain frontend resmi
}));
app.use(express.json());

// Routes
app.use('/api/games', gamesRouter);

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    data: {
      status: 'healthy',
      time: new Date().toISOString(),
    },
    error: null,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err, 'Unhandled application error');
  res.status(500).json({
    ok: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong on the server',
    },
  });
});

export default app;
