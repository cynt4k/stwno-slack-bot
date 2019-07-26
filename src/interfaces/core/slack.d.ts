export interface ISlackWorkspaces {
    accessToken: string;
    teamId: string;
    botUser: string;
}

export interface ISlackTeamSettings {
    teamId: string;
    language: 'en' | 'de';
    cronjob?: {
        mensa: string;
        time: Date;
    };
}