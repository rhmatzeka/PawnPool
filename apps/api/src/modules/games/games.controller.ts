import { Request, Response } from 'express';
import { GamesService } from './games.service';
import { z } from 'zod';

export class GamesController {
  public static async createGame(req: Request, res: Response) {
    try {
      const game = await GamesService.createGame();
      res.json({
        ok: true,
        data: game,
        error: null,
      });
    } catch (e: any) {
      res.status(500).json({
        ok: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: e.message,
        },
      });
    }
  }

  public static async getGameState(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const state = await GamesService.getGameState(gameId);
      
      if (!state) {
        return res.status(404).json({
          ok: false,
          data: null,
          error: {
            code: 'GAME_NOT_FOUND',
            message: 'Game session not found',
          },
        });
      }

      res.json({
        ok: true,
        data: state,
        error: null,
      });
    } catch (e: any) {
      res.status(500).json({
        ok: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: e.message,
        },
      });
    }
  }

  public static async placeBetMock(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const schema = z.object({
        address: z.string(),
        team: z.enum(['WHITE', 'BLACK']),
        piece: z.enum(['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING']),
        amountWei: z.string(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          ok: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.message,
          },
        });
      }

      const { address, team, piece, amountWei } = parsed.data;
      const bet = await GamesService.placeBetMock(gameId, address, team, piece, amountWei);

      res.json({
        ok: true,
        data: bet,
        error: null,
      });
    } catch (e: any) {
      let status = 500;
      let code = 'INTERNAL_ERROR';

      if (e.message === 'GAME_NOT_ACTIVE') {
        status = 400;
        code = 'GAME_NOT_ACTIVE';
      } else if (e.message === 'TURN_LOCKED') {
        status = 400;
        code = 'TURN_LOCKED';
      } else if (e.message === 'TEAM_ALREADY_LOCKED') {
        status = 400;
        code = 'TEAM_ALREADY_LOCKED';
      } else if (e.message === 'ALREADY_BET_THIS_TURN') {
        status = 400;
        code = 'ALREADY_BET_THIS_TURN';
      }

      res.status(status).json({
        ok: false,
        data: null,
        error: {
          code,
          message: e.message,
        },
      });
    }
  }

  public static async resolveTurn(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      
      // Admin API key auth check
      const authHeader = req.headers['authorization'];
      const apiKey = authHeader && authHeader.split(' ')[1];
      
      if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({
          ok: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid admin API key',
          },
        });
      }

      const resolution = await GamesService.resolveTurnMock(gameId);
      
      res.json({
        ok: true,
        data: resolution,
        error: null,
      });
    } catch (e: any) {
      res.status(500).json({
        ok: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: e.message,
        },
      });
    }
  }
}
