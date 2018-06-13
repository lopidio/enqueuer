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
const conditional_injector_1 = require("conditional-injector");
const logger_1 = require("../loggers/logger");
const amqp = require('amqp');
let AmqpSubscription = class AmqpSubscription extends subscription_1.Subscription {
    constructor(subscriptionAttributes) {
        super(subscriptionAttributes);
        this.options = subscriptionAttributes.options;
        this.exchange = subscriptionAttributes.exchange;
        this.routingKey = subscriptionAttributes.routingKey;
        this.queueName = subscriptionAttributes.queueName;
    }
    receiveMessage() {
        return new Promise((resolve) => {
            this.connection.queue(this.queueName, (queue) => {
                logger_1.Logger.debug(`Binding ${this.queueName} to exchange ${this.exchange} and routingKey ${this.routingKey}`);
                queue.bind(this.exchange, this.routingKey, () => {
                    logger_1.Logger.debug(`Queue ${this.queueName} bound. Subscribing.`);
                    queue.subscribe((message) => {
                        logger_1.Logger.debug(`Queue ${this.queueName} subscribed.`);
                        resolve(message.data.toString());
                    });
                });
            });
        });
    }
    connect() {
        this.connection = amqp.createConnection(this.options);
        return new Promise((resolve, reject) => {
            this.connection.on('ready', () => resolve());
            this.connection.on('error', (err) => reject(err));
        });
    }
    unsubscribe() {
        if (this.connection) {
            this.connection.disconnect();
        }
        delete this.connection;
    }
};
AmqpSubscription = __decorate([
    conditional_injector_1.Injectable({ predicate: (subscriptionAttributes) => subscriptionAttributes.type === "amqp" }),
    __metadata("design:paramtypes", [Object])
], AmqpSubscription);
exports.AmqpSubscription = AmqpSubscription;