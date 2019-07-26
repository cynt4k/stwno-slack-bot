import localtunnel from 'localtunnel';
import sshTunnel from 'tunnel-ssh';
import { IConfigExpress } from '@home/interfaces';
import { MensaError } from '@home/error';

export namespace TunnelService {
    let tunnel: localtunnel.Tunnel;

    export const init = (s: IConfigExpress): Promise<string> => new Promise<string>((resolve, reject) => {

        const options: localtunnel.TunnelConfig = {
            subdomain: s.tunnelDomain
        };


        tunnel = localtunnel(s.port, options, (e, initialized) => {
            if (e) return reject(e);
            if (!initialized) return reject(new MensaError('tunnel not initialized'));
            return resolve(initialized.url);
        });
    });

    export const disconnect = (): void => {
        tunnel.close();
    };
}
