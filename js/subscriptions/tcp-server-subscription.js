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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_1 = require("./subscription");
const conditional_injector_1 = require("conditional-injector");
const net = __importStar(require("net"));
const variables_controller_1 = require("../variables/variables-controller");
const logger_1 = require("../loggers/logger");
let TcpServerSubscription = class TcpServerSubscription extends subscription_1.Subscription {
    constructor(subscriptionAttributes) {
        super(subscriptionAttributes);
        this.port = subscriptionAttributes.port;
        this.persistStreamName = subscriptionAttributes.persistStreamName;
        this.greetingResponse = subscriptionAttributes.greetingResponse;
        if (typeof subscriptionAttributes.response != 'string') {
            this.response = JSON.stringify(subscriptionAttributes.response);
        }
        this.loadStreamName = subscriptionAttributes.loadStreamName;
        if (this.loadStreamName) {
            this.loadStream();
        }
    }
    receiveMessage() {
        return new Promise((resolve, reject) => {
            if (this.loadStreamName) {
                this.waitForData(reject, resolve);
            }
            else {
                console.log('connection: ' + this.server);
                this.server.once('connection', (stream) => {
                    this.stream = stream;
                    if (this.greetingResponse) {
                        logger_1.Logger.debug(`Tcp server sending greeting message`);
                        this.stream.write(this.greetingResponse);
                    }
                    this.waitForData(reject, resolve);
                    this.server.close();
                    this.server = null;
                });
            }
        });
    }
    connect() {
        return new Promise((resolve) => {
            if (this.loadStreamName) {
                logger_1.Logger.debug('Server is reusing tcp stream');
                resolve();
                return;
            }
            this.server = net.createServer()
                .listen(this.port, 'localhost', () => {
                logger_1.Logger.debug(`Tcp server is listening for tcp clients`);
                resolve();
            });
        });
    }
    sendResponse() {
        if (this.stream) {
            logger_1.Logger.debug(`Tcp server sending response`);
            this.stream.write(this.response, () => this.persistStream());
        }
    }
    loadStream() {
        logger_1.Logger.debug(`Server is loading tcp stream: ${this.loadStreamName}`);
        this.stream = variables_controller_1.VariablesController.sessionVariables()[this.loadStreamName];
        if (this.stream) {
            logger_1.Logger.debug(`Server loaded tcp stream: ${this.loadStreamName}`);
        }
        else {
            throw new Error(`Impossible to load tcp stream: ${this.loadStreamName}`);
        }
    }
    waitForData(reject, resolve) {
        logger_1.Logger.trace(`Tcp server is waiting on data`);
        console.log('end: ' + this.stream);
        this.stream.once('end', () => {
            logger_1.Logger.debug(`Tcp server detected 'end' event`);
            reject();
        });
        console.log('data: ' + this.stream);
        this.stream.once('data', (msg) => {
            logger_1.Logger.debug(`Tcp server got data ${msg}`);
            resolve(msg);
        });
    }
    persistStream() {
        if (this.persistStreamName) {
            logger_1.Logger.debug(`Persisting subscription tcp stream ${this.persistStreamName}`);
            variables_controller_1.VariablesController.sessionVariables()[this.persistStreamName] = this.stream;
            this.persistStreamName = undefined;
        }
        else {
            logger_1.Logger.trace(`Ending TCP stream`);
            this.stream.end();
        }
    }
};
TcpServerSubscription = __decorate([
    conditional_injector_1.Injectable({ predicate: (subscriptionAttributes) => subscriptionAttributes.type === 'tcp-server' }),
    __metadata("design:paramtypes", [Object])
], TcpServerSubscription);
exports.TcpServerSubscription = TcpServerSubscription;
