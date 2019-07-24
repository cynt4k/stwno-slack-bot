import { Router } from 'express';
import { SlackController } from '@home/controller';

const router = Router();

router.post('/receive', SlackController.receiveSlack);

export const SlackRoute = router;
