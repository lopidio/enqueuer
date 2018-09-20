"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const logger_1 = require("../loggers/logger");
const javascript_object_notation_1 = require("../object-notations/javascript-object-notation");
class HttpRequester {
    constructor(url, method, headers = {}, body, timeout = 3000) {
        this.url = url;
        this.method = method;
        this.headers = headers;
        this.body = body;
        this.timeout = timeout;
    }
    request() {
        return new Promise((resolve, reject) => {
            logger_1.Logger.info(`Hitting (${this.method.toUpperCase()}) - ${this.url}`);
            const options = this.createOptions();
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            request_1.default(options, (error, response) => {
                if (error) {
                    reject('Http request error: ' + error);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    createOptions() {
        let options = {
            url: this.url,
            method: this.method,
            timeout: this.timeout,
            headers: this.headers
        };
        options.data = options.body = this.handleObjectPayload();
        if (this.method.toUpperCase() != 'GET') {
            options.headers['Content-Length'] = options.headers['Content-Length'] || this.setContentLength(options.data);
        }
        return options;
    }
    setContentLength(value) {
        if (Buffer.isBuffer(value)) {
            return value.length;
        }
        else {
            return Buffer.from(value, 'utf8').byteLength;
        }
    }
    handleObjectPayload() {
        if (this.method.toUpperCase() == 'GET') {
            return undefined;
        }
        try {
            new javascript_object_notation_1.JavascriptObjectNotation().parse(this.body);
            return this.body;
        }
        catch (exc) {
            //do nothing
        }
        if (typeof (this.body) != 'string') {
            this.body = new javascript_object_notation_1.JavascriptObjectNotation().stringify(this.body);
        }
        return this.body;
    }
}
exports.HttpRequester = HttpRequester;
