import { ExpressDriver } from './drivers/drivers';
import * as dotenv from 'dotenv';
import { MongoConnector } from './Shared/MongoConnector';
dotenv.config();
// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------

let dbURI;
switch (process.env.NODE_ENV) {
  case 'development':
    dbURI = process.env.CLARK_DB_URI_DEV.replace(
      /<DB_PASSWORD>/g,
      process.env.CLARK_DB_PWD,
    )
      .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
      .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    break;
  case 'production':
    dbURI = process.env.CLARK_DB_URI.replace(
      /<DB_PASSWORD>/g,
      process.env.CLARK_DB_PWD,
    )
      .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
      .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    break;
  case 'test':
    dbURI = process.env.CLARK_DB_URI_TEST;
    break;
  default:
    break;
}

MongoConnector.build(dbURI)
  .then(() => {
    ExpressDriver.start();
  });

