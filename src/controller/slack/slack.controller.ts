import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';
import { SlackService, Logger } from '@home/core';
import { StoreItem, StoreItems } from 'botbuilder';
import { ISlackWorkspaces } from '@home/interfaces';
import { HttpCodes, I18n } from '@home/misc';

export namespace SlackController {

    export const receiveSlack = async (req: Request, res: Response, next: NextFunction) => {
        SlackService.adapter.processActivity(req, res, async (context) => {
            await SlackService.controller.handleTurn(context);
            return;
        });
    };

    export const registerSlack = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await SlackService.adapter.validateOauthCode(req.query.code);

            const team_id = results.team_id;
            const token = results.bot.bot_access_token;
            const bot_user = results.bot.bot_user_id;

            const items = await SlackService.controller.storage.read(['workspaces']);

            const workspaces: ISlackWorkspaces[] = items['workspaces'];

            const exist = _.find(workspaces, (elem) => elem.teamId === team_id);

            if (!exist) {
                const entry: ISlackWorkspaces = {
                    teamId: team_id,
                    accessToken: token,
                    botUser: bot_user
                };
                workspaces.push(entry);
                await SlackService.controller.storage.write({ workspaces });
                res.data = {
                    code: HttpCodes.OK,
                    message: I18n.INFO_SUCCESS
                };
            } else {
                res.data = {
                    code: HttpCodes.BadRequest,
                    message: I18n.WARN_SLACK_ALREADY_REGISTERED
                };
            }
            return next();

        } catch (e) {
            Logger.error(`oauth error - ${e}`);
            return next(e);
        }
    };
}
