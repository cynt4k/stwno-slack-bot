export interface IApiResponse<T> {
    code: number;
    message: string;
    data?: T
}

export interface ITranslation {
    de: string;
    en: string;
}

export interface IMensa {
    id: string;
    name: ITranslation;
}

export interface IMealIngredients {
    key: string;
    name: ITranslation;
}

export interface IMeal {
    name: string;
    type: string;
    date: Date;
    ingredients: IMealIngredients[];
    price: {
        student: number;
        employee: number;
        guest: number;
    };
}