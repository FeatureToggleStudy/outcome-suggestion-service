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
Object.defineProperty(exports, "__esModule", { value: true });
var assert_never_1 = require("assert-never");
var SuggestionInteractor = /** @class */ (function () {
    function SuggestionInteractor(dataStore) {
        this.dataStore = dataStore;
    }
    Object.defineProperty(SuggestionInteractor.prototype, "responder", {
        set: function (responder) {
            this._responder = responder;
        },
        enumerable: true,
        configurable: true
    });
    /**
        * Search for outcomes related to a given text string.
        *
        * FIXME: We may want to transform this into a streaming algorithm,
        *       rather than waiting for schema -> entity conversion
        *       for the entire list. I don't know if there's a good way
        *       to do that, but the terms 'Buffer' and 'Readable' seem
        *       vaguely promising.
        *
        * @param {string} text the words to search for
        * @param {suggestMode} mode which suggestion mode to use:
        *      'text' - uses mongo's native text search query
        *      'regex' - matches outcomes containing each word in text
        * @param {number} threshold minimum score to include in results
        *      (ignored if mode is 'regex')
        *
        * @returns {Outcome[]} list of outcome suggestions, ordered by score
        */
    SuggestionInteractor.prototype.suggestOutcomes = function (text, mode, threshold, filter) {
        if (mode === void 0) { mode = 'text'; }
        if (threshold === void 0) { threshold = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var suggestions, cursor, doc, suggestion, score, filtered, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        suggestions = [];
                        cursor = void 0;
                        switch (mode) {
                            case 'text':
                                cursor = this.dataStore.searchOutcomes(text)
                                    .sort({ score: { $meta: 'textScore' } });
                                break;
                            case 'regex':
                                cursor = this.dataStore.matchOutcomes(text);
                                break;
                            default: this._responder.sendObject(assert_never_1.default(mode));
                        }
                        _a.label = 1;
                    case 1: return [4 /*yield*/, cursor.hasNext()];
                    case 2:
                        if (!_a.sent()) return [3 /*break*/, 4];
                        return [4 /*yield*/, cursor.next()];
                    case 3:
                        doc = _a.sent();
                        suggestion = {
                            id: doc._id,
                            author: doc.author,
                            name: doc.name_,
                            date: doc.date,
                            outcome: doc.outcome,
                        };
                        // if mode provides scoring information
                        if (doc['score'] !== undefined) {
                            score = doc['score'];
                            // skip record if score is lower than threshold
                            if (score < threshold)
                                return [3 /*break*/, 4];
                            /*
                             * TODO: Look into sorting options. An streaming insert
                             *       sort here may be better than mongo's,
                             *       if such a thing is possible
                             * In that case, switch break above to continue.
                             */
                        }
                        suggestions.push(suggestion);
                        return [3 /*break*/, 1];
                    case 4:
                        filtered = suggestions.filter(function (suggestion) {
                            for (var prop in filter) {
                                if (suggestion[prop] && suggestion[prop].indexOf(filter[prop]) < 0) {
                                    return false; // leave out suggestion if it doesn't contain filter text
                                }
                            }
                            return true;
                        });
                        this._responder.sendObject(filtered);
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        this._responder.sendOperationError(e_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ;
    return SuggestionInteractor;
}());
exports.SuggestionInteractor = SuggestionInteractor;
