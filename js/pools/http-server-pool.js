"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const logger_1 = require("../loggers/logger");
class HttpServerPool {
    constructor() {
        this.ports = {};
        this.initializeExpress();
    }
    static getInstance() {
        if (!HttpServerPool.instance) {
            HttpServerPool.instance = new HttpServerPool();
        }
        return HttpServerPool.instance;
    }
    getApp() {
        return this.app;
    }
    getHttpServer(port) {
        return new Promise((resolve, reject) => {
            logger_1.Logger.debug(`Getting a Http server ${port}`);
            if (!this.ports[port]) {
                logger_1.Logger.debug(`Creating a new Http server ${port}`);
                const server = http_1.default.createServer(this.app);
                this.listenToPort(server, port)
                    .then(() => {
                    this.ports[port] = server;
                    resolve();
                })
                    .catch((err) => reject(err));
                this.ports[port] = server;
            }
            resolve();
        });
    }
    getHttpsServer(credentials, port) {
        return new Promise((resolve, reject) => {
            logger_1.Logger.debug(`Getting a Https server ${port}`);
            if (!this.ports[port]) {
                logger_1.Logger.debug(`Creating a new Https server ${port}`);
                const server = https_1.default.createServer(credentials, this.app);
                this.listenToPort(server, port)
                    .then(() => {
                    this.ports[port] = server;
                    resolve();
                })
                    .catch((err) => reject(err));
                this.ports[port] = server;
            }
            resolve();
        });
    }
    listenToPort(server, port) {
        return new Promise((resolve, reject) => {
            server.on('error', (err) => {
                if (err) {
                    const message = `Error emitted from server (${port}) ${err}`;
                    logger_1.Logger.error(message);
                    return reject(message);
                }
            });
            try {
                logger_1.Logger.info(`Binding server to port ${port}`);
                server.listen(port, (err) => {
                    if (err) {
                        const message = `Error listening to port (${port}) ${err}`;
                        logger_1.Logger.error(message);
                        return reject(message);
                    }
                    return resolve();
                });
            }
            catch (err) {
                const message = `Error caught from server (${port}) ${err}`;
                logger_1.Logger.error(message);
                return reject(message);
            }
        });
    }
    initializeExpress() {
        if (!this.app) {
            this.app = express_1.default();
            this.app.use((req, res, next) => {
                req.setEncoding('utf8');
                req.rawBody = '';
                req.on('data', (chunk) => {
                    req.rawBody += chunk;
                });
                req.on('end', () => {
                    logger_1.Logger.trace(`Http(s) server got message: ${req.rawBody}`);
                    next();
                });
            });
        }
    }
}
exports.HttpServerPool = HttpServerPool;
