"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var drivers_1 = require("../drivers");
var http = require("http");
var ExpressDriver = /** @class */ (function () {
    function ExpressDriver() {
    }
    ExpressDriver.start = function (dataStore) {
        // configure app to use bodyParser()
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        //Setup route logger
        // this.app.use(logger('dev'));
        // set header to allow connection by given url
        this.app.use(function (req, res, next) {
            // Website you wish to allow to connect
            res.header('Access-Control-Allow-Origin', '*');
            // Request methods you wish to allow
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            // Request headers you wish to allow
            res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.header('Access-Control-Allow-Credentials', 'true');
            // Pass to next layer of middleware
            next();
        });
        // Set our api routes
        this.app.use('/api', drivers_1.ExpressRouteDriver.buildRouter(dataStore));
        /**
         * Get port from environment and store in Express.
         */
        var port = process.env.PORT || '3000';
        this.app.set('port', port);
        /**
         * Create HTTP server.
         */
        var server = http.createServer(this.app);
        /**
         * Listen on provided port, on all network interfaces.
         */
        server.listen(port, function () { return console.log("API running on localhost:" + port); });
        return this.app;
    };
    ExpressDriver.app = express();
    return ExpressDriver;
}());
exports.ExpressDriver = ExpressDriver;
