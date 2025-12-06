<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

### Environment Variables

This application requires the following environment variables to be set. Copy `.env.example` to `.env` and fill in the values:

#### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis server hostname
- `REDIS_PORT` - Redis server port (default: 6379)
- `STORAGE_ACCESS_KEY` - S3-compatible storage access key
- `STORAGE_SECRET_KEY` - S3-compatible storage secret key
- `STORAGE_ENDPOINT` - S3-compatible storage endpoint URL
- `STORAGE_BUCKET_NAME` - S3 bucket name (default: pdf-merger-bucket)

#### Optional Variables

- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `STORAGE_REGION` - S3 region (default: us-east-1)
- `WORKER_CONCURRENCY` - Number of concurrent workers (default: 5)
- `LOG_LEVEL` - Logging level (error/warn/info/debug/trace)
- `SENTRY_DSN` - Sentry error tracking DSN
- `THROTTLE_TTL` - Rate limiting time window (default: 60000ms)
- `THROTTLE_LIMIT` - Rate limiting max requests (default: 10)

### Deploying to Netlify

1. **Set Environment Variables** in Netlify Dashboard:
   - Go to Site Settings → Environment Variables
   - Add all required variables listed above
   - **Critical**: Ensure `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and `STORAGE_ENDPOINT` are set

2. **Build Configuration**:
   - Build command: `npx prisma generate && npm run build`
   - Publish directory: `dist`
   - Functions directory: `.netlify/functions`

3. **Common Issues**:

   **Error: "Cannot read properties of undefined (reading 'get')"**
   - **Cause**: Missing or incorrectly configured environment variables
   - **Solution**: Verify all required environment variables are set in Netlify dashboard
   - **Check**: Go to Netlify Dashboard → Site Settings → Environment Variables
   - **Verify**: `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and `STORAGE_ENDPOINT` are present

   **Error: "ConfigService is not available"**
   - **Cause**: Dependency injection issue in serverless environment
   - **Solution**: This is now handled with defensive checks in the code
   - **Action**: Ensure you're using the latest version of the codebase

4. **Verify Deployment**:
   ```bash
   # Check function logs in Netlify dashboard
   # Look for: "S3 Service initialized successfully for bucket: <bucket-name>"
   ```

### Deploying to Other Platforms

When deploying to other platforms (AWS, Heroku, etc.), ensure:
- All environment variables are properly set
- PostgreSQL database is accessible
- Redis instance is running and accessible
- S3-compatible storage is configured
- Prisma migrations are run: `npx prisma migrate deploy`

For more information, check out the [NestJS deployment documentation](https://docs.nestjs.com/deployment).

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
