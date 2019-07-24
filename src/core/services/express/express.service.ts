import express from 'express';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import { Logger, ExpressHandler } from '@home/core/utils';
import { IConfigExpress } from '@home/interfaces/config';

export namespace ExpressService {
    let config: IConfigExpress;
    let app: express.Express;

    interface IInitFinished {
        port: number;
        server: string;
    }

    export const init = async (c: IConfigExpress): Promise<IInitFinished> => {
        config = c;

        app = express();
        app.set('port', config.port);
        app.use(compression());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(methodOverride());
        app.use(Logger.getExpressLogger());

        app.get('/', (req: Request, res: Response, next: NextFunction) => {
            res.status(200).send('OK');
        });


        app.use('*', ExpressHandler.express);
        app.all('*', ExpressHandler.checkResponse);
        app.all('*', ExpressHandler.unkownRouteHandler);

        try {
            await app.listen(app.get('port'));
            return Promise.resolve({
                port: config.port,
                server: 'localhost'
            });
        } catch (e) {
            return Promise.reject(e);
        }
    };
}
