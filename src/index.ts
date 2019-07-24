import 'module-alias/register';
import config from 'config';
import { Logger, ExpressService, TunnelService } from '@home/core';
import { IConfig, IConfigMensa, IConfigMongodb, IConfigSlack, IConfigExpress } from '@home/interfaces';

Logger.init();

(async () => {

    const mensaConfig = config.get<IConfigMensa>('mensa');
    const mongodbConfig = config.get<IConfigMongodb>('mongodb');
    const slackConfig = config.get<IConfigSlack>('slack');
    const expressConfig = config.get<IConfigExpress>('express');

    try {
        const result = await ExpressService.init(expressConfig);
        Logger.info(`Server spawned under http://${result.server}:${result.port}`);
    } catch (e) {
        Logger.error(e);
        process.exit(1);
    }

    try {
        const tunnel = await TunnelService.init(expressConfig);
        Logger.info(`Tunnel url spawned under domain ${tunnel}`);
    } catch (e) {
        Logger.error(e);
        process.exit(1);
    }

    Logger.info('Started');


    const disconnect = (): void => {
        TunnelService.disconnect();
    };

    process.on('SIGTERM', (code) => {
        disconnect();
        process.exit(0);
    });

    process.on('SIGINT', (code) => {
        disconnect();
        process.exit(0);
    });
})();
