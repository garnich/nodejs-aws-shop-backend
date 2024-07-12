import { handler } from '../lambda/catalogBatchProcess';
import { SQSEvent } from 'aws-lambda';


jest.mock('@aws-sdk/lib-dynamodb', () => {
    const mDynamoDBClient = { send: jest.fn() };
    return {
      DynamoDBClient: jest.fn(() => mDynamoDBClient),
      DynamoDBDocumentClient: {
        from: jest.fn(() => mDynamoDBClient),
      },
      marshall: jest.fn(),
    };
  });
  
  jest.mock('@aws-sdk/client-sns', () => {
    return {
      SNSClient: jest.fn(() => ({ send: jest.fn() })),
      PublishCommand: jest.fn(),
    };
  });

describe('catalogBatchProcess handler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return a 400 if products have wrong data", async () => {
    const event = {
      Records: [
        {
          body:  JSON.stringify({
            description:"Short Product Description2",
            price: 45,
            count: 2
          }),
        },
      ],
    } as SQSEvent;
    const res = await handler(event);

    const message = res.body as string;
    expect(message).toEqual("Invalid request, product have wrong structure");
    expect(res.statusCode).toBe(400);
  });

it('should return 201 status when product is successfully added', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Test Product',
            description: 'Test Description',
            price: 100,
            count: 10,
          }),
        },
      ],
    };

    const response = await handler(event as SQSEvent);

    const message = response.body as string;

    expect(message).toEqual("New Product created and added to DB");
    expect(response.statusCode).toEqual(201);
  });
});
