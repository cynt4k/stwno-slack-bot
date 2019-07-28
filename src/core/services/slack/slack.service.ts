import { Botkit, BotWorker, BotkitMessage } from 'botkit';
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware, SlackDialog, SlackBotWorker } from 'botbuilder-adapter-slack';
import { MongoDbStorage } from 'botbuilder-storage-mongodb';
import _ from 'lodash';
import qwant from 'qwant-api';
import { IConfigSlack, IConfigExpress, IConfigMongodb, ISlackWorkspaces, ISlackTeamSettings, IMeal } from '@home/interfaces';
import { Logger } from '@home/core/utils';
import { MensaService } from '../mensa';
import { MensaError, ErrorCode } from '@home/error';

interface ISlackDialogSelect {
    value: string;
    label: string;
}

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
        // @ts-ignore
        controller.on('slash_command', handleSlashCommand);
        controller.on('interactive_message', handleInteractiveMessage);
        // @ts-ignore
        controller.on('dialog_submission', handleDialogSubmission);
        controller.on('block_actions', handleBlockActions);
    };

    const handleSlashCommand = async (bot: SlackBotWorker, entryMessage: BotkitMessage) => {
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
                const dialog = await createMensaDialog(entryMessage.team_id, messages[1]);
                await bot.replyWithDialog(entryMessage, dialog.asObject());
                // await bot.reply(entryMessage, dialog.asObject());
                break;
                // await bot.reply(
                //     entryMessage,
                //     await createMensaSelect(entryMessage.team_id, entryMessage.incoming_message.conversation.id, messages[1])); break;
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

    const handleDialogSubmission = async (bot: SlackBotWorker, entryMessage: BotkitMessage) => {

        const teamSettings = await getTeamSettings(entryMessage.team.id);

        switch (entryMessage.callback_id) {
            case 'mensa_dialog':
                const mensa = entryMessage.submission.mensa as string;
                const date = new Date(Date.parse(entryMessage.submission.date));
                const mensaMenu = await createMensaMenu(mensa, teamSettings.language, date);
                const sentMessage = await bot.reply(entryMessage, 'Loading menu');
                bot.deleteMessage(sentMessage);
                bot.reply(entryMessage, mensaMenu);
                break;
            default: await bot.reply(entryMessage, 'Unknown dialog callback_id');
        }
        return Promise.resolve();
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

    const createMensaDialog = async (teamId: string, locationId?: string): Promise<SlackDialog> => {
        const teamSettings = await getTeamSettings(teamId);
        const mensas = await MensaService.getMensas();
        const now = new Date();

        const dialog = new SlackDialog('Select a mensa', 'mensa_dialog', 'Request');

        const mensa_options: [ISlackDialogSelect] = _.map(mensas, (mensa): ISlackDialogSelect => {
            return {
                value: mensa.id,
                label: mensa.name[teamSettings.language]
            };
        }) as [ISlackDialogSelect];

        const date_options: ISlackDialogSelect[] = [];

        for (let i = 1; i < 7; i++) {
            const first = now.getDate() - now.getDay() + i;
            const day = new Date(now.setDate(first));
            date_options.push({
                value: `${day.getFullYear()}-${day.getMonth()}-${day.getDay()}`,
                label: day.toDateString()
            });
        }


        dialog.addSelect('Select a mensa', 'mensa', 'selected_mensa', mensa_options);
        dialog.addSelect('Select a date', 'date', 'selected_date', date_options as [ISlackDialogSelect]);

        return dialog;
    };

    const createMensaMenu = async (locationId: string, language: string, day: Date): Promise<object> => {
        const message = {
            blocks: [] as any[]
        };

        message.blocks.push({
            type: 'section',
            text: {
                type: 'plain_text',
                text: `Meal for ${day.toDateString()}`,
                emoji: false
            }
        });
        message.blocks.push({
            type: 'divider'
        });

        const weekdays = [ 'su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

        try {
            const meals = await MensaService.getMealsForMensa(locationId, weekdays[day.getDate()]);

            const createMealText = (meal: IMeal): string => {
                const priceFormat = (price: number): string => {
                    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
                };

                return `*${meal.name}*\nPrice\n\tStudents: *${priceFormat(meal.price.student)}*\n\tEmployee: *${priceFormat(meal.price.employee)}*\n\tGuest: *${priceFormat(meal.price.guest)}*`;
            };

            if (meals.length === 0) {
                message.blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*No meals*'
                    }
                });
            } else {
                await Promise.all(_.map(meals, async (meal): Promise<void> => {
                    const mealPicture = await searchQwantImages(meal.name);
                    message.blocks.push({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: createMealText(meal)
                        },
                        accessory: {
                            type: 'image',
                            image_url: mealPicture[0] || 'https://i.redd.it/fr3ij4z9gti01.jpg',
                            alt_text: meal.name
                        }
                    });
                    const ingredients = _.map(meal.ingredients, (ingredient): string => ingredient.name[language]);
                    message.blocks.push({
                        type: 'context',
                        elements: [{
                            type: 'plain_text',
                            emoji: false,
                            text: ingredients.join(', ') || 'No ingredients'
                        }]
                    });
                    return Promise.resolve();
                }));
            }

            return Promise.resolve(message);
        } catch (e) {
            Logger.error(e.message);
            return Promise.reject(e);
        }
    };

    const searchQwantImages = async (search: string): Promise<string[]> => new Promise<string[]>((resolve, reject) => {
        qwant.search('images', { query: search, count: 1, offset: 0, language: 'german' }, (e, data) => {
            if (e) return reject(e);
            const images: string[] = _.map(data.data.result.items, (entry) => entry.media);
            return resolve(images);
        });
    });
}
