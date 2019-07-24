import { Botkit, BotWorker, BotkitMessage } from 'botkit';
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware, SlackDialog, SlackBotWorker } from 'botbuilder-adapter-slack';
import { MongoDbStorage } from 'botbuilder-storage-mongodb';
import { IConfigSlack, IConfigExpress, IConfigMongodb } from '@home/interfaces';

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
                return Promise.resolve('jo');
            },
            getBotUserByTeam: async(teamId) => {
                return Promise.resolve('jo');
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

    };

    const handleInteractiveMessage = async (bot: BotWorker, entryMessage: BotkitMessage) => {

    };

    const handleDialogSubmission = async (bot: BotWorker, entryMessage: BotkitMessage) => {

    };

    const handleBlockActions = async (bot: BotWorker, entryMessage: BotkitMessage) => {

    };
}
