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
const requisition_starter_1 = require("../requisitions/requisition-starter");
const daemon_requisition_input_1 = require("../requisitions/daemon-requisition-input");
const logger_1 = require("../loggers/logger");
const multi_publisher_1 = require("../publishers/multi-publisher");
const enqueuer_executor_1 = require("./enqueuer-executor");
const configuration_1 = require("../configurations/configuration");
const injector_1 = require("../injector/injector");
let DaemonEnqueuerExecutor = class DaemonEnqueuerExecutor extends enqueuer_executor_1.EnqueuerExecutor {
    constructor(enqueuerConfiguration) {
        super();
        logger_1.Logger.info("Executing in Daemon mode");
        const configuration = new configuration_1.Configuration();
        this.multiPublisher = new multi_publisher_1.MultiPublisher(configuration.getOutputs());
        ;
        this.requisitionInputs = enqueuerConfiguration["daemon"]
            .map((input) => new daemon_requisition_input_1.DaemonRequisitionInput(input));
        ;
    }
    execute() {
        return new Promise(() => {
            this.requisitionInputs
                .forEach((input) => {
                input.connect()
                    .then(() => {
                    return this.startReader(input);
                })
                    .catch((err) => {
                    logger_1.Logger.error(err);
                    input.unsubscribe();
                });
            });
        });
    }
    startReader(input) {
        input.receiveMessage()
            .then((requisition) => {
            this.multiPublisher.publish(JSON.stringify(requisition)).then(() => this.startReader(input));
            new requisition_starter_1.RequisitionStarter(requisition).start().then();
        })
            .catch((err) => {
            logger_1.Logger.error(err);
            this.multiPublisher.publish(JSON.stringify(err)).then(() => this.startReader(input));
        });
    }
};
DaemonEnqueuerExecutor = __decorate([
    injector_1.Injectable(enqueuerConfiguration => enqueuerConfiguration["daemon"]),
    __metadata("design:paramtypes", [Object])
], DaemonEnqueuerExecutor);
exports.DaemonEnqueuerExecutor = DaemonEnqueuerExecutor;