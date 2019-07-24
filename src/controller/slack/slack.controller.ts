import { Request, Response, NextFunction } from 'express';
import { SlackService } from '@home/core';

export namespace SlackController {

    export const receiveSlack = async (req: Request, res: Response, next: NextFunction) => {
        SlackService.adapter.processActivity(req, res, async (context) => {
            await SlackService.controller.handleTurn(context);
            return;
        });
    };

    export const registerSlack = async (req: Request, res: Response, next: NextFunction) => {

    };
}
