"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_reporter_1 = require("../reporters/subscription/subscription-reporter");
const runnable_parser_1 = require("../runnables/runnable-parser");
class SingleRunInput {
    constructor(singleRunConfiguration) {
        this.executorTimeout = null;
        this.subscriptionReporter = new subscription_reporter_1.SubscriptionReporter({
            type: 'file-name-watcher',
            name: 'SingleRunInput',
            fileNamePattern: singleRunConfiguration.fileNamePattern,
            files: singleRunConfiguration.files,
            timeout: 100
        });
        this.runnableParser = new runnable_parser_1.RunnableParser();
    }
    syncDir() {
        return this.subscriptionReporter.subscribe();
    }
    onNoMoreFilesToBeRead(executorTimeout) {
        this.executorTimeout = executorTimeout;
    }
    receiveRequisition() {
        if (this.executorTimeout) {
            this.subscriptionReporter.startTimeout(this.executorTimeout);
        }
        return this.subscriptionReporter
            .receiveMessage()
            .then((file) => {
            file.content = this.runnableParser.parse(file.content);
            return file;
        });
    }
}
exports.SingleRunInput = SingleRunInput;
