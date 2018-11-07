import { SessionManager } from '@springworks/spark-partner-service-client';
import { Request, ResponseToolkit } from 'hapi';

export const SESSION_COOKIE_NAME = 'spark_session';

export class HapiSessionManager implements SessionManager {
  constructor(private request: Request, private h: ResponseToolkit) {}

  public async getFromSession(key: string): Promise<string> {
    const session = this.request.state[SESSION_COOKIE_NAME] || {};
    return session[key];
  }

  public async storeInSession(key: string, value: string): Promise<void> {
    const session = this.request.state[SESSION_COOKIE_NAME] || {};
    session[key] = value;
    this.h.state(SESSION_COOKIE_NAME, session);
  }
}
