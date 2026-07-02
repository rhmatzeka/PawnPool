import { Router } from 'express';
import { GamesController } from './games.controller';

const router: Router = Router();

router.post('/', GamesController.createGame);
router.get('/active', GamesController.getActiveGame);
router.get('/:gameId/state', GamesController.getGameState);
router.post('/:gameId/votes/mock-bet', GamesController.placeBetMock);
router.post('/:gameId/resolve-turn', GamesController.resolveTurn);

export default router;
