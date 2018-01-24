"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
exports.DBID = mongodb_1.ObjectID;
var clark_schema_1 = require("clark-schema");
var clark_schema_2 = require("clark-schema");
var dotenv = require("dotenv");
dotenv.config();
var MongoDriver = /** @class */ (function () {
    function MongoDriver() {
        var dburi = process.env.NODE_ENV === 'production' ?
            process.env.CLARK_DB_URI.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD).replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT).replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
            : process.env.CLARK_DB_URI_DEV.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD).replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT).replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
        this.connect(dburi);
    }
    MongoDriver.prototype.connect = function (dburi) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, mongodb_1.MongoClient.connect(dburi)];
                    case 1:
                        _a.db = _b.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_1 = _b.sent();
                        return [2 /*return*/, Promise.reject('Problem connecting to database at ' + dburi + ':\n\t' + e_1)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.disconnect = function () {
        this.db.close();
    };
    /**
         * Fetch the user document associated with the given id.
         * @async
         *
         * @param id database id
         *
         * @returns {UserRecord}
         */
    MongoDriver.prototype.fetchUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.fetch(clark_schema_2.UserSchema, id)];
            });
        });
    };
    /////////////////
    // TEXT SEARCH //
    /////////////////
    /**
     * Find outcomes matching a text query.
     * This variant uses Mongo's fancy text query. Questionable results.
     * NOTE: this function also projects a score onto the cursor documents
     *
     * @param {string} text the words to search for
     *
     * @returns {Cursor<OutcomeRecord>} cursor of positive matches
     */
    MongoDriver.prototype.searchOutcomes = function (text) {
        return this.db.collection(clark_schema_1.collectionFor(clark_schema_2.StandardOutcomeSchema))
            .find({ $text: { $search: text } }, { score: { $meta: 'textScore' } });
    };
    /**
     * Find outcomes matching a text query.
     * This variant finds all outcomes containing every word in the query.
     * @param {string} text the words to match against
     *
     * @returns {Cursor<OutcomeRecord>} cursor of positive matches
     */
    MongoDriver.prototype.matchOutcomes = function (text) {
        var tokens = text.split(/\s/);
        var docs = [];
        try {
            for (var tokens_1 = __values(tokens), tokens_1_1 = tokens_1.next(); !tokens_1_1.done; tokens_1_1 = tokens_1.next()) {
                var token = tokens_1_1.value;
                docs.push({ outcome: { $regex: token } });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (tokens_1_1 && !tokens_1_1.done && (_a = tokens_1.return)) _a.call(tokens_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // score property is not projected, will be undefined in documents
        return this.db.collection(clark_schema_1.collectionFor(clark_schema_2.StandardOutcomeSchema))
            .find({
            $and: docs,
        });
        var e_2, _a;
    };
    ////////////////////////////////////////////////
    // GENERIC HELPER METHODS - not in public API //
    ////////////////////////////////////////////////
    /**
     * Fetch a database record by its id.
     * @param {Function} schema provides collection information
     * @param {RecordID} id the document to fetch
     */
    MongoDriver.prototype.fetch = function (schema, id) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.collection(clark_schema_1.collectionFor(schema)).findOne({ _id: id })];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, Promise.reject('Problem fetching a ' + schema.name + ':\n\tInvalid database id ' + JSON.stringify(id))];
                        return [2 /*return*/, Promise.resolve(record)];
                }
            });
        });
    };
    return MongoDriver;
}());
exports.MongoDriver = MongoDriver;
