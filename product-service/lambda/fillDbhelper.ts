
import { IProduct, ICount } from '../types';
import { countGenerator } from './contGenerator';

export const fillStockData = (products: IProduct[]): ICount[] => {
  return products.map(({ id }) => {
    return {
        product_id: id,
        count: countGenerator(),
    }
  })
};
