import { handler } from '../lambda/importFileParser';
import csv from 'csv-parser';
import { Readable } from 'stream';

jest.mock('@aws-sdk/client-s3', () => {
    const originalModule = jest.requireActual('@aws-sdk/client-s3');
    
    class MockS3Client extends originalModule.S3Client {
      send(command: any) {
        if (command instanceof originalModule.GetObjectCommand) {
          const mockData = new Readable();
          mockData.push('test data');
          mockData.push(null);
          return Promise.resolve({ Body: mockData });
        } else if (command instanceof originalModule.CopyObjectCommand || command instanceof originalModule.DeleteObjectCommand) {
          return Promise.resolve();
        }
      }
    }
    
    return {
      ...originalModule,
      S3Client: MockS3Client,
    };
  });
jest.mock('csv-parser');

describe('handler', () => {
  it('should process s3 records', async () => {
    // Arrange
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/test.csv',
            },
          },
        },
      ],
    };

    const mockData = new Readable();
    mockData.push('test data');
    mockData.push(null);

    (csv as jest.MockedFunction<typeof csv>).mockImplementation(() => {
      const transform = new Readable({ objectMode: true });
      transform.push({ test: 'data' });
      transform.push(null);
      return transform;
    });

    // Act
    const result = await handler(mockEvent);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('File parsing: DONE.');
  });
});
