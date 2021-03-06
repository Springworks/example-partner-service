import { SparkPartnerServiceClient } from '@springworks/spark-partner-service-client';
import * as handlebars from 'handlebars';
import { Request, RequestQuery, ResponseToolkit, Server } from 'hapi';
import joi = require('joi');
import { HapiSessionManager, SESSION_COOKIE_NAME } from './session-manager';

const default_port = 3000;

const default_client = new SparkPartnerServiceClient({
  client_id: 'some-spark_client-id',
  client_secret: 'some-spark_client-secret-that-needs-to-be-sufficiently-long',
  callback_url: 'http://localhost:3000/auth',
});

export async function createServer(
  port: number = default_port,
  spark_client: SparkPartnerServiceClient = default_client,
): Promise<Server> {
  const server = new Server({
    host: '0.0.0.0',
    port,
  });

  // Encrypting cookies
  server.state(SESSION_COOKIE_NAME, {
    path: '/',
    isSameSite: 'Lax',
    encoding: 'iron',
    password: 'password-should-be-at-least-32-characters',
    isSecure: !(process.env.NODE_ENV === 'test'),
  });

  await configureRouting(server, spark_client);

  return server;
}

async function configureRouting(server: Server, spark_client: SparkPartnerServiceClient): Promise<void> {
  await server.register(require('vision'));

  server.views({
    engines: { html: handlebars },
    relativeTo: __dirname,
    path: './templates',
  });

  server.route([
    {
      method: 'GET',
      path: '/landing',
      handler: async (request: Request, h: ResponseToolkit) => {
        const session_manager = new HapiSessionManager(request, h);

        // Check if session is authenticated
        if (!(await spark_client.currentSubject(session_manager))) {
          return h.redirect('/login');
        }

        return h.view('landing-page', { subject: await spark_client.currentSubject(session_manager) });
      },
    },
    {
      method: 'GET',
      path: '/auth',
      options: {
        validate: {
          query: {
            code: joi.string().required(),
            redirect_uri: joi.string(),
            state: joi.string(),
          },
        },
      },
      handler: async (request: Request, h: ResponseToolkit) => {
        const session_manager = new HapiSessionManager(request, h);

        // Check if session is authenticated
        if (!!(await spark_client.currentSubject(session_manager))) {
          return h.redirect('/landing');
        }

        // Check callback parameters and extract `subject` (user identification)
        // and `access_token` (token for an Authorization header) values
        const { subject, access_token } = await spark_client.authorizationCallback(
          request.query as RequestQuery,
          session_manager,
        );
        return h.redirect('/landing');
      },
    },
    {
      method: 'GET',
      path: '/login',
      handler: async (request: Request, h: ResponseToolkit) => {
        const session_manager = new HapiSessionManager(request, h);

        // Check if session is authenticated
        if (!!(await spark_client.currentSubject(session_manager))) {
          return h.redirect('/landing');
        }

        // Generate a random and unpredictable state to prevent phishing
        const state = 'a random state';
        const auth_url = await spark_client.authorizationUrl(state, session_manager);
        return h.redirect(auth_url);
      },
    },
  ]);
}
