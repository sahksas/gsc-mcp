import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'fs/promises';
import path from 'path';

export class GoogleAuth {
  private oauth2Client: OAuth2Client | null = null;
  private credentialsPath: string;

  constructor() {
    this.credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          path.join(process.cwd(), 'credentials.json');
  }

  async initialize(): Promise<void> {
    try {
      const credentialsContent = await readFile(this.credentialsPath, 'utf-8');
      const credentials = JSON.parse(credentialsContent);

      if (credentials.type === 'service_account') {
        const { GoogleAuth: ServiceAuth } = await import('google-auth-library');
        const serviceAuth = new ServiceAuth({
          keyFile: this.credentialsPath,
          scopes: ['https://www.googleapis.com/auth/webmasters.readonly',
                   'https://www.googleapis.com/auth/webmasters']
        });
        this.oauth2Client = await serviceAuth.getClient() as OAuth2Client;
      } else if (credentials.web || credentials.installed) {
        const config = credentials.web || credentials.installed;
        this.oauth2Client = new OAuth2Client(
          config.client_id,
          config.client_secret,
          config.redirect_uris?.[0]
        );
        
        const tokenPath = process.env.GOOGLE_TOKEN_PATH || 
                         path.join(process.cwd(), 'token.json');
        try {
          const tokenContent = await readFile(tokenPath, 'utf-8');
          const token = JSON.parse(tokenContent);
          this.oauth2Client.setCredentials(token);
        } catch (error) {
          throw new Error('Token file not found. Please run authentication flow first.');
        }
      }
    } catch (error) {
      throw new Error(`Failed to initialize authentication: ${error}`);
    }
  }

  getClient(): OAuth2Client {
    if (!this.oauth2Client) {
      throw new Error('Authentication not initialized');
    }
    return this.oauth2Client;
  }

  async getAccessToken(): Promise<string> {
    const client = this.getClient();
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }
    return token;
  }
}