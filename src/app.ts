import {MongoConnector} from './Shared/MongoConnector';
import {ExpressDriver} from './express/ExpressDriver';
import {generateDbURI} from './Shared/GenerateDbURI';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
let dbURI = generateDbURI();

MongoConnector.build(dbURI)
  .then(() => {
    ExpressDriver.start();
  });

