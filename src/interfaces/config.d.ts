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
    id: string;
    secret: string;
    token: string;
}

export interface IConfigExpress {
    port: number;
    version: string;
}

export interface IConfig {
    mensa: IConfigMensa;
    mongodb: IConfigMongodb;
    slack: IConfigSlack;
    express: IConfigExpress;
}
