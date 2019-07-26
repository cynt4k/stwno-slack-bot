import { Botkit, BotWorker, BotkitMessage } from 'botkit';
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware, SlackDialog, SlackBotWorker } from 'botbuilder-adapter-slack';
import { MongoDbStorage } from 'botbuilder-storage-mongodb';
import _ from 'lodash';
import { IConfigSlack, IConfigExpress, IConfigMongodb, ISlackWorkspaces, ISlackTeamSettings } from '@home/interfaces';
import { Logger } from '@home/core/utils';
import { MensaService } from '../mensa';
import { MensaError, ErrorCode } from '@home/error';

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
        if (!entryMessage.text) {
            return Promise.resolve();
        }
        const messages = entryMessage.text.split(' ');

        switch (messages[0]) {
            case '':
            case 'help':
                await bot.reply(entryMessage, createHelpMessage()); break;
            case 'info':
                await bot.reply(entryMessage, createInfoMessage()); break;
            case 'location':
                await bot.reply(
                    entryMessage,
                    await createMensaSelect(entryMessage.team_id, entryMessage.incoming_message.conversation.id, messages[1])); break;
            default:
                await bot.reply(entryMessage, 'Unknown command');
                await bot.reply(entryMessage, createHelpMessage());
                break;
        }
        return Promise.resolve();
    };

    const handleInteractiveMessage = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        Logger.info(entryMessage.text || 'no message');
        await bot.reply(entryMessage, 'jo');
    };

    const handleDialogSubmission = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        Logger.info(entryMessage.text || 'no message');
        await bot.reply(entryMessage, 'jo');
    };

    const handleBlockActions = async (bot: BotWorker, entryMessage: BotkitMessage) => {
        const action = entryMessage.actions[0];

        switch (action.block_id) {
            case 'mensa_date':
                const selectedDate = Date.parse(action.selected_date);

                break;
            case 'mensa_location':

        }
    };

    const createInfoMessage = (): string => {
        return 'To use the Mensaplan you can do following things\n' +
        ' - Get meals for a mensa\n' +
        ' - Get meals for a mensa and the day\n' +
        ' - Publish the mensaplan for a mensa daily';
    };

    const createHelpMessage = (): string => {
        return 'You can use following commands\n' +
        ' /mensaplan location \t (Start the mensplan dialog)\n' +
        ' /mensaplan location [locationId] \t (Display meals for today)\n' +
        ' /mensaplan location [locationId] [day] \t (Display meals for this day\n' +
        ' /mensaplan settings \t (Set mensa settings - e.g. Language, daily publish)';
    };

    const getTeamSettings = async (teamId: string): Promise<ISlackTeamSettings> => {
        const items = await controller.storage.read(['settings']);

        const teams: ISlackTeamSettings[] = items['settings'];
        const team = _.find(teams, (elem) => elem.teamId === teamId);

        if (!team) {
            return Promise.reject(new MensaError(`unknown teamId - ${teamId}`, ErrorCode.SLACK_INVALID_TEAM));
        }

        return Promise.resolve(team);
    };

    const getConversations = async(conversationid: string): Promise<any> => {
        const items = await controller.storage.read(['conversation']);

        const conversations = items['conversation'];
    };

    const createMensaSelect = async (teamId: string, conversationId: string, locationId?: string): Promise<object> => {
        const teamSettings = await getTeamSettings(teamId);
        const mensas = await MensaService.getMensas();
        const now = new Date();
        const message = {
            blocks: [] as any[]
        };

        const location = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: 'Select a mensa from the list'
            },
            block_id: 'mensa_location',
            accessory: {
                type: 'static_select',
                placeholder: {
                    type: 'plain_text',
                    text: 'Select a mensa',
                    emoji: true
                },
                options: [] as any[]
            }
        };

        _.forEach(mensas, (mensa) => {
            location.accessory.options.push({
                text: {
                    type: 'plain_text',
                    text: mensa.name[teamSettings.language],
                    emoji: false
                },
                value: mensa.id
            });
        });

        message.blocks.push(location);
        message.blocks.push({
            type: 'divider'
        });

        const datePicker = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: 'Pick a date for the mensa'
            },
            block_id: 'mensa_date',
            accessory: {
                type: 'datepicker',
                initial_date: `${now.getFullYear()}-${now.getMonth()}-${now.getDay()}`,
                placeholder: {
                    type: 'plain_text',
                    text: 'Select a date',
                    emoji: true
                }
            }
        };
        message.blocks.push(datePicker);

        return message;
    };

    const createMensaMenu = async (locationId: string, day: Date) => {
        const message = {
            blocks: []
        };

        const weekdays = [ 'su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

        try {
            const meals = await MensaService.getMealsForMensa(locationId, weekdays[day.getDate()]);

            Logger.info(meals.toString());
        } catch (e) {
            Logger.error(e.message);
            return Promise.reject(e);
        }
    };

    // const getMensaNames = async (language: 'en' | 'de'): Promise<void> => {
    //     const mensas = await MensaService.getMensas();

    //     _.forEach(mensas, (mensa) => {
    //         mensa.name[language]
    //     });
    // };
}
