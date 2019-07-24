export interface IConfigMensa {
    baseUrl: string;
}

export interface IConfigMongodb {
    server: string;
    username: string;
    password: string;
    database: string;
}

export interface IConfigSlack {
    clientId: string;
    clientSecret: string;
    clientSigningSecret: string;
    redirectBaseUrl: string;
}

export interface IConfigExpress {
    port: number;
    version: string;
    tunnelDomain: string;
}

export interface IConfig {
    mensa: IConfigMensa;
    mongodb: IConfigMongodb;
    slack: IConfigSlack;
    express: IConfigExpress;
}
