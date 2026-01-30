import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  const config = new DocumentBuilder()
    .setTitle("Telegram Bot Admin API")
    .setDescription("The Telegram Bot Admin API description")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT ?? 4000;
  console.log(`Starting server on 0.0.0.0:${port}`);
  await app.listen(port, "0.0.0.0");
  console.log(`Server is running on: ${await app.getUrl()}`);
}
bootstrap();
