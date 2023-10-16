# submission-portal-api

## Description

This is a TypeScript powered REST API backend service to upload image to S3 and extract information, then return to the end user.

- platform: AWS
- language: TypeScript
- runtime/environment: NodeJS
- framewrok: serverless

### Start the service

To start the service locally:
`npm run start`

To deploy the service in AWS:
`npm run deploy`

To check the code limting:
`npm run lint`

To fix the issues with code limting:
`npm run lint:fix`

To generate the swagger doc:
`npm run swagger`

### API Diagram

<img src="/src/resources/api-diagram.png" alt="API Diagram"/>

### API Documentation

[swagger](https://mdrijwan.github.io/submission-portal-api/)

### App Integratioon

This backend service is integrated with the [Submission Portal App](https://github.com/mdrijwan/submission-portal-web). Only authenticated users from the app can access the API.
