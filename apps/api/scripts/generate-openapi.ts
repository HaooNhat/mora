import { AppModule } from '@mora/api/app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import 'tsconfig-paths/register';

async function generateOpenApiYaml() {
  const app = await NestFactory.create(AppModule, { logger: false });

  // Build Swagger config
  const config = new DocumentBuilder()
    .setTitle('Procurement Platform API')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  // Generate OpenAPI document
  const document = SwaggerModule.createDocument(app, config);

  // Convert JSON to YAML
  const yamlStr = yaml.dump(document);

  // Write YAML to file
  fs.writeFileSync('./openapi.yaml', yamlStr, 'utf8');

  await app.close();
  console.log('✅ OpenAPI spec generated: openapi.yaml');
}

generateOpenApiYaml().catch((err) => {
  console.error('❌ Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
