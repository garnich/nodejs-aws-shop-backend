import { products } from '../lambda/products';
import { handler } from '../lambda/getProductsById';

describe('GET /api/products/:id', () => {
  it('should return product', async () => {
    const product = products[0];
    const event = { pathParameters: { productId: product.id } } as any;
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toStrictEqual({
      description: product.description,
      id: product.id,
      price: product.price,
      title: product.title,
    });
  });

  it('should return correct status code if product not found', async () => {
    const event = { pathParameters: { productId: '111' } } as any;
    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toBe('NOT found. Product with id 111 does not exist.');
  });
});
