import { Router } from 'express';
import { SlackController } from '@home/controller';

const router = Router();

router.post('/receive', SlackController.receiveSlack);
router.post('/mensaplan', SlackController.receiveSlack);
router.get('/install', SlackController.registerSlack);

export const SlackRoute = router;
