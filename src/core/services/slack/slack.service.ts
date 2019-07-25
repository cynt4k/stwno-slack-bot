import { Botkit, BotWorker, BotkitMessage } from 'botkit';
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware, SlackDialog, SlackBotWorker } from 'botbuilder-adapter-slack';
import { MongoDbStorage } from 'botbuilder-storage-mongodb';
import _ from 'lodash';
import { IConfigSlack, IConfigExpress, IConfigMongodb, ISlackWorkspaces } from '@home/interfaces';
import { Logger } from '@home/core/utils';

export namespace SlackService {
    let config: IConfigSlack;

    export let controller: Botkit;
    export let adapter: SlackAdapter;

    export const init = (c: IConfigSlack, e: IConfigExpress, m: IConfigMongodb) => {
        config = c;
        adapter = new SlackAdapter({
            redirectUri: `${config.redirectBaseUrl}/${e.version}/slack/install`,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            clientSigningSecret: config.clientSigningSecret,
            scopes: [ 'commands', 'bot' ],
            getTokenForTeam: async(teamId) => {
                try {
                    const items = await controller.storage.read(['workspaces']);
                    const workspaces: ISlackWorkspaces[] = items['workspaces'];

                    const team = _.find(workspaces, (elem) => elem.teamId === teamId);
                    if (!team) {
                        return Promise.reject('no token for team');
                    }
                    return Promise.resolve(team.accessToken);
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            getBotUserByTeam: async(teamId) => {
                try {
                    const items = await controller.storage.read(['workspaces']);
                    const workspaces: ISlackWorkspaces[] = items['workspaces'];

                    const team = _.find(workspaces, (elem) => elem.teamId === teamId);
                    if (!team) {
                        return Promise.reject('no botUser for team');
                    }
                    return Promise.resolve(team.botUser);
                } catch (e) {
                    return Promise.reject(e);
                }
            }
        });

        adapter.use(new SlackEventMiddleware());
        adapter.use(new SlackMessageTypeMiddleware());

        const storage = new MongoDbStorage({
            url: `mongodb://${m.username}:${m.password}@${m.server}/${m.database}`
        });

        controller = new Botkit({
            adapter: adapter,
            storage: storage,
            disable_webserver: true
        });

        setupController();
    };

    const setupController = () => {
        controller.on('slash_command', handleSlashCommand);
        controller.on('interactive_message', handleInteractiveMessage);
        controller.on('dialog_submission', handleDialogSubmission);
        controller.on('block_actions', handleBlockActions);
    };

    const handleSlashCommand = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        Logger.info(entryMessage.text || 'no message');
        bot.reply(entryMessage, 'jo');
    };

    const handleInteractiveMessage = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        Logger.info(entryMessage.text || 'no message');
        bot.reply(entryMessage, 'jo');
    };

    const handleDialogSubmission = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        Logger.info(entryMessage.text || 'no message');
        bot.reply(entryMessage, 'jo');
    };

    const handleBlockActions = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        Logger.info(entryMessage.text || 'no message');
        bot.reply(entryMessage, 'jo');
    };
}
