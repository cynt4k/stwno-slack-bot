import 'module-alias/register';
import { Logger } from '@home/core';

Logger.init();

(async () => {
    Logger.info('Started');
})();
