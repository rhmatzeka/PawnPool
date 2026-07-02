import { createServer } from 'http';
import app from './app';
import { SocketServer } from './modules/realtime/socket.server';
import { env } from './config/env';
import { logger } from './shared/logger';

const server = createServer(app);

// Inisialisasi Socket.IO Server
SocketServer.init(server);

server.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  logger.info(`Mock Chain mode is set to: ${env.MOCK_CHAIN}`);
});
