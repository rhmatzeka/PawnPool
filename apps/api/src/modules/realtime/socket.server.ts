import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../../shared/logger';
import { GamesService } from '../games/games.service';

export class SocketServer {
  private static instance: Server | null = null;
  private static spectatorCounts: Map<string, number> = new Map();

  public static init(server: HttpServer): Server {
    if (this.instance) {
      return this.instance;
    }

    const io = new Server(server, {
      cors: {
        origin: '*', // Di production ganti dengan domain frontend resmi
        methods: ['GET', 'POST'],
      },
    });

    const arenaNamespace = io.of('/arena');

    arenaNamespace.on('connection', (socket: Socket) => {
      logger.info({ socketId: socket.id }, 'Client connected to /arena');

      let currentRoom: string | null = null;

      socket.on('arena:join', async (payload: { gameId: string }) => {
        const { gameId } = payload;
        const roomName = `arena:${gameId}`;
        
        // Tinggalkan room sebelumnya jika ada
        if (currentRoom) {
          socket.leave(currentRoom);
          this.decrementSpectators(currentRoom, arenaNamespace);
        }

        socket.join(roomName);
        currentRoom = roomName;

        this.incrementSpectators(roomName, arenaNamespace);
        logger.info({ socketId: socket.id, roomName }, 'Client joined arena room');

        // Emit initial spectator count ke user yang baru join
        socket.emit('spectator:count', {
          gameId,
          count: this.spectatorCounts.get(roomName) || 1,
        });

        const state = await GamesService.getGameState(gameId);
        if (state) {
          socket.emit('game:state', state);
        }
      });

      socket.on('arena:leave', () => {
        if (currentRoom) {
          socket.leave(currentRoom);
          this.decrementSpectators(currentRoom, arenaNamespace);
          currentRoom = null;
        }
      });

      socket.on('disconnect', () => {
        if (currentRoom) {
          this.decrementSpectators(currentRoom, arenaNamespace);
        }
        logger.info({ socketId: socket.id }, 'Client disconnected from /arena');
      });
    });

    this.instance = io;
    return io;
  }

  public static getInstance(): Server {
    if (!this.instance) {
      throw new Error('SocketServer must be initialized first!');
    }
    return this.instance;
  }

  private static incrementSpectators(room: string, namespace: any) {
    const current = this.spectatorCounts.get(room) || 0;
    const next = current + 1;
    this.spectatorCounts.set(room, next);
    this.broadcastSpectators(room, next, namespace);
  }

  private static decrementSpectators(room: string, namespace: any) {
    const current = this.spectatorCounts.get(room) || 0;
    const next = Math.max(0, current - 1);
    this.spectatorCounts.set(room, next);
    this.broadcastSpectators(room, next, namespace);
  }

  private static broadcastSpectators(room: string, count: number, namespace: any) {
    const gameId = room.split(':')[1];
    namespace.to(room).emit('spectator:count', {
      gameId,
      count,
    });
  }
}
