import { products } from './products';

export const handler = async () => {
    try {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Methods': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(products),
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
