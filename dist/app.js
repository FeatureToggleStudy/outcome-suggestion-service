"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var drivers_1 = require("./drivers/drivers");
// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
var dataStore = new drivers_1.MongoDriver();
// ----------------------------------------------------------------------------------
drivers_1.ExpressDriver.start(dataStore);
