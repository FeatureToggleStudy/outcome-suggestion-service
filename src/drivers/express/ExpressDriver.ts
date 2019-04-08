import * as express from 'express';
import * as bodyParser from 'body-parser';
import { ExpressRouteDriver } from '../drivers';
import * as http from 'http';
import * as logger from 'morgan';
import * as cors from 'cors';

export class ExpressDriver {
  static app = express();
  static start() {
    // configure app to use bodyParser()
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // Setup route logger
    this.app.use(logger('dev'));


    this.app.use(
      cors({
        origin: true,
        credentials: true,
      }),
    );

    // Set our api routes
    this.app.use('/', ExpressRouteDriver.buildRouter());

    /**
     * Get port from environment and store in Express.
     */
    const port = process.env.PORT || '3000';
    this.app.set('port', port);

    /**
     * Create HTTP server.
     */
    const server = http.createServer(this.app);

    /**
     * Listen on provided port, on all network interfaces.
     */
    server.listen(port, () =>
      console.log(`Outcome Suggestion Service running at http://localhost:${port}`),
    );

    return this.app;
  }
}
