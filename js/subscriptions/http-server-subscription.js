"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_1 = require("./subscription");
const logger_1 = require("../loggers/logger");
const conditional_injector_1 = require("conditional-injector");
const http_server_pool_1 = require("../pools/http-server-pool");
const http_authentication_1 = require("../http-authentications/http-authentication");
let HttpServerSubscription = class HttpServerSubscription extends subscription_1.Subscription {
    constructor(subscriptionAttributes) {
        super(subscriptionAttributes);
        this.credentials = subscriptionAttributes.credentials;
        this.authentication = subscriptionAttributes.authentication;
        this.port = subscriptionAttributes.port;
        this.endpoint = subscriptionAttributes.endpoint;
        this.method = subscriptionAttributes.method.toLowerCase();
        this.response = subscriptionAttributes.response || {};
        this.response.status = this.response.status || 200;
        if (!this.response) {
            throw new Error(`Invalid ${this.type}: no 'response' field was given`);
        }
    }
    receiveMessage() {
        return new Promise((resolve) => {
            this.app[this.method](this.endpoint, (request, responseHandler, next) => {
                const payload = request.rawBody;
                logger_1.Logger.debug(`${this.type}:${this.port} got hit (${request.method}) ${this.endpoint}: ${payload}`);
                if (!this.response.payload) {
                    this.response.payload = payload;
                }
                for (const key in this.response.header) {
                    responseHandler.header(key, this.response.header[key]);
                }
                let headers = {};
                Object.keys(request.headers)
                    .forEach((header) => headers[header] = request.headers[header]);
                this.responseHandler = responseHandler;
                const result = {
                    headers,
                    params: request.params,
                    query: request.query,
                    body: payload
                };
                resolve(result);
                next();
            });
        });
    }
    subscribe() {
        return new Promise((resolve, reject) => {
            if (this.type == 'https-server') {
                http_server_pool_1.HttpServerPool.getInstance().getHttpsServer(this.credentials, this.port)
                    .then((app) => {
                    this.app = app;
                    resolve();
                }).catch(err => reject(err));
            }
            else if (this.type == 'http-server') {
                http_server_pool_1.HttpServerPool.getInstance().getHttpServer(this.port)
                    .then((app) => {
                    this.app = app;
                    resolve();
                }).catch(err => reject(err));
            }
            else {
                return reject(`${this.type} type is not known`);
            }
        });
    }
    unsubscribe() {
        http_server_pool_1.HttpServerPool.getInstance().closeServer(this.port);
    }
    sendResponse() {
        return new Promise((resolve, reject) => {
            if (this.responseHandler) {
                try {
                    logger_1.Logger.debug(`${this.type} sending response`);
                    this.responseHandler.status(this.response.status).send(this.response.payload);
                    logger_1.Logger.trace(`${this.type} response sent`);
                    resolve();
                }
                catch (err) {
                    throw `${this.type} response back sending error: ${err}`;
                }
            }
            else {
                reject(`No ${this.type} response handler found`);
            }
        });
    }
    onMessageReceivedTests() {
        if (this.authentication && this.messageReceived) {
            logger_1.Logger.debug(`${this.type} authenticating message with ${JSON.stringify(Object.keys(this.authentication))}`);
            const verifier = conditional_injector_1.Container.subclassesOf(http_authentication_1.HttpAuthentication).create(this.authentication);
            return verifier.verify(this.messageReceived.headers.authorization);
        }
        return [];
    }
};
HttpServerSubscription = __decorate([
    conditional_injector_1.Injectable({
        predicate: (subscriptionAttributes) => subscriptionAttributes.type === 'http-server'
            || subscriptionAttributes.type === 'https-server'
    }),
    __metadata("design:paramtypes", [Object])
], HttpServerSubscription);
exports.HttpServerSubscription = HttpServerSubscription;
