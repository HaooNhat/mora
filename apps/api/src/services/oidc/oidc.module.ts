import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';

@Module({
  imports: [],
  providers: [OidcService],
  exports: [OidcService],
})
export class OidcModule {}
