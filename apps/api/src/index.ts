import { createServer } from 'http';
import app from './app';
import { SocketServer } from './modules/realtime/socket.server';
import { env } from './config/env';
import { logger } from './shared/logger';
import { prisma } from './shared/prisma';
import { GamesService } from './modules/games/games.service';

const server = createServer(app);

// Inisialisasi Socket.IO Server
SocketServer.init(server);

// Scheduler loop untuk turn resolution
setInterval(async () => {
  try {
    const activeGames = await prisma.game.findMany({
      where: {
        status: 'ACTIVE',
        turnStatus: 'OPEN',
      },
      include: {
        turns: {
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
      },
    });

    for (const game of activeGames) {
      const currentTurn = game.turns[0];
      if (currentTurn && currentTurn.endsAt && new Date() >= currentTurn.endsAt) {
        logger.info({ gameId: game.id, turnNumber: game.turnNumber }, 'Turn timer expired. Resolving turn.');
        // Jalankan resolution
        GamesService.resolveTurnMock(game.id).catch((err) => {
          logger.error(err, `Error resolving turn for game ${game.id}`);
        });
      }
    }
  } catch (err) {
    logger.error(err, 'Error in turn resolution scheduler');
  }
}, 2000);

server.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  logger.info(`Mock Chain mode is set to: ${env.MOCK_CHAIN}`);
});
