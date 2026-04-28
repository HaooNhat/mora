import oidcConfig from '@mora/api/configs/oidc.config';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as config from '@nestjs/config';
import * as client from 'openid-client';

@Injectable()
export class OidcService implements OnModuleInit {
  private config: client.Configuration;
  constructor(
    @Inject(oidcConfig.KEY)
    private readonly oidcConf: config.ConfigType<typeof oidcConfig>,
  ) {}

  async onModuleInit() {
    await this.init();
  }

  async init() {
    try {
      this.config = await client.discovery(
        new URL('https://accounts.google.com'),
        this.oidcConf.googleClientID,
        this.oidcConf.googleClientSecret,
      );
    } catch (error: unknown) {
      console.error('OIDC discovery failed', error);
      throw error;
    }
  }

  async getAuthUrl(state: string) {
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge =
      await client.calculatePKCECodeChallenge(code_verifier);
    const nonce = client.randomNonce();

    return {
      url: client.buildAuthorizationUrl(this.config, {
        redirect_uri: this.oidcConf.googleCallbackURL,
        scope: 'openid email profile',
        code_challenge,
        code_challenge_method: 'S256',
        state: state,
        nonce: nonce,
      }),
      code_verifier,
      nonce,
    };
  }

  async callback(
    currentUrl: URL,
    code_verifier: string,
    state: string,
    nonce: string,
  ) {
    const tokens = await client.authorizationCodeGrant(
      this.config,
      currentUrl,
      {
        pkceCodeVerifier: code_verifier,
        expectedState: state,
        expectedNonce: nonce,
        idTokenExpected: true,
      },
      { redirect_uri: this.oidcConf.googleCallbackURL },
    );

    return tokens.claims();
  }
}
