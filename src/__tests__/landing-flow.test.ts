import { SparkPartnerServiceClient } from '@springworks/spark-partner-service-client';
import { Server } from 'hapi';
import { jar, Response } from 'request';
import { anyString, anything, instance, mock, reset, when } from 'ts-mockito';
import { makeRequest } from '../request-helper';
import { createServer } from '../service-provider';

async function landingRequest(server_url: string): Promise<Response> {
  return makeRequest({
    url: `${server_url}/landing`,
    method: 'GET',
    jar: jar(),
  });
}

describe('test/routes/landing-flow-test.js', () => {
  let spark_client: SparkPartnerServiceClient;
  let server: Server;

  beforeAll(async () => {
    spark_client = mock(SparkPartnerServiceClient);

    server = await createServer(0, instance(spark_client));
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  afterEach(() => {
    reset(spark_client);
  });

  describe(`GET /landing`, () => {
    beforeEach(() => {
      jest.mock('../data-provider', () => ({
        getVin: jest.fn(() => 'vin'),
      }));
    });

    describe('when request is authenticated', () => {
      let result: any;

      beforeEach(() => {
        when(spark_client.currentSubject(anything())).thenResolve('some-subject');
        when(spark_client.authorizationHeader(anything())).thenResolve('Bearer access_token');
      });

      beforeEach(async () => {
        result = await landingRequest(server.info.uri);
      });

      it('should respond with status 200', async () => {
        expect(result.statusCode).toEqual(200);
      });

      it('should return hello user message', async () => {
        expect(result.body).toContain('Hello an authenticated user');
      });

      it('should not be redirected', async () => {
        expect(result.request.headers.referer).toBeUndefined();
      });
    });

    describe('when request is not authenticated', () => {
      let result: any;

      beforeEach(() => {
        when(spark_client.authorizationUrl(anyString(), anything())).thenCall(
          (state: string) => `/auth?code=code&state=${state}`,
        );
      });

      beforeEach(() => {
        when(spark_client.authorizationCallback(anything(), anything())).thenCall(() => {
          const subject = 'new-subject';
          const access_token = 'new_access_token';
          when(spark_client.currentSubject(anything())).thenResolve(subject);
          when(spark_client.authorizationHeader(anything())).thenResolve(`Bearer ${access_token}`);
          return {
            access_token,
            subject,
          };
        });
      });

      beforeEach(async () => {
        result = await landingRequest(server.info.uri);
      });

      it('should respond with status 200', async () => {
        expect(result.statusCode).toEqual(200);
      });

      it('should return hello user message', async () => {
        expect(result.body).toContain('Hello an authenticated user');
      });

      it(`should be redirected from '/auth'`, async () => {
        expect(result.request.headers.referer).toBeTruthy();
        expect(result.request.headers.referer).toContain(`/auth`);
      });
    });
  });
});
