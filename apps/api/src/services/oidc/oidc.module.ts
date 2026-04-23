import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';
import oidcConfig from './configs/oidc.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forFeature(oidcConfig)],
  providers: [OidcService],
  exports: [OidcService],
})
export class OidcModule {}
