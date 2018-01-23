"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExpressResponder = /** @class */ (function () {
    function ExpressResponder(res) {
        this.res = res;
    }
    ExpressResponder.prototype.sendOperationSuccess = function () {
        this.res.sendStatus(200);
    };
    ExpressResponder.prototype.sendOperationError = function (error, status) {
        error && status ? this.res.status(status).send(error)
            : error && !status ? this.res.status(400).send(error)
                : !error && status ? this.res.status(status).send("Server error encounter.")
                    : this.res.status(400).send("Server error encounter.");
    };
    ExpressResponder.prototype.sendObject = function (object) {
        this.res.status(200).send(object);
    };
    return ExpressResponder;
}());
exports.ExpressResponder = ExpressResponder;
