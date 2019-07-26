import request from 'request';
import urlJoin from 'url-join';
import { IConfigMensa, IMeal, IMensa, IResponse, IApiResponse } from '@home/interfaces';

export namespace MensaService {
    let config: IConfigMensa;

    export const init = (c: IConfigMensa): void => {
        config = c;
    };

    export const getMealsForMensa = async (locationId: string, day: string): Promise<IMeal[]> => new Promise<IMeal[]>((resolve, reject) => {
        const url = urlJoin(config.baseUrl, 'mensa', locationId);

        const mensaRequest = request.get(url);

        mensaRequest.on('response', (res) => {
            return resolve();
        });

        mensaRequest.on('error', (e) => {
            return reject(e);
        });
    });

    export const getMensas = async (): Promise<IMensa[]> => new Promise<IMensa[]>((resolve, reject) => {
        const url = urlJoin(config.baseUrl, 'mensa');

        request.get(url, (e, res, body) => {
            if (e) return reject(e);
            const rawBody: IApiResponse<IMensa[]> = JSON.parse(body);
            return resolve(rawBody.data);
        });
    });
}
