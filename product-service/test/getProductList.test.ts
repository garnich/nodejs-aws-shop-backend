import { products } from '../lambda/products';
import { handler } from '../lambda/getProductList';

describe('GET /api/products', () => {
  it('should return list of products', async () => {
    const response = await handler();

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(expect.arrayContaining(products));
  });
});
