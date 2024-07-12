export interface IProduct {
        id: string;
        title: string;
        description: string;
        price: number;
};

export interface ICount {
        product_id: string;
        count: number;
};

export interface IProductWithCount extends IProduct {
        count: number;
};
