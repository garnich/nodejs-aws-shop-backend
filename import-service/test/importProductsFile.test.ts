import { handler } from '../lambda/importProductsFile';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mocked } from "jest-mock";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockedS3Client = mocked(S3Client, { shallow: true });
const mockedGetSignedUrl = mocked(getSignedUrl, { shallow: true });

describe('handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name is not provided', async () => {
    const event = {
      queryStringParameters: null
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: "File should be named." }));
  });

  it('should return signed URL if name is provided', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.csv'
      }
    };

    mockedGetSignedUrl.mockResolvedValue('http://signed-url');

    const response = await handler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('http://signed-url');
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(
      expect.any(mockedS3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 300 }
    );
  });

  it('should return 500 if getting signed URL fails', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.csv'
      }
    };

    mockedGetSignedUrl.mockRejectedValue(new Error('Error'));

    const response = await handler(event as any);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(JSON.stringify({ message: "Internal Server Error" }));
  });
});
