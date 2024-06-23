import { products } from './products';
import { IProduct } from '../types';

export const handler = async (event: any) => {
    try {
        const id = event.pathParameters.id;
        const product = products.find((product: IProduct) => product.id === id);

        if (!product) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Methods': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    `NOT found. Product with id ${id} does not exist.`
                ),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Methods': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Methods': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(error.message),
        };
    }
};
