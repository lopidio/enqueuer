import {MessageReceiver} from './message-receiver';
import {Logger} from '../loggers/logger';
import {EventExecutor} from './event-executor';
import {TestModel} from '../models/outputs/test-model';

//TODO test it
export class OnMessageReceivedEventExecutor extends EventExecutor {
    private messageReceiver: MessageReceiver;

    constructor(name: string, messageReceiver: MessageReceiver) {
        super(messageReceiver.onMessageReceived);
        this.messageReceiver = messageReceiver;

        if (typeof(this.messageReceiver.messageReceived) == 'object' && !Buffer.isBuffer(this.messageReceiver.messageReceived)) {
            Object.keys(this.messageReceiver.messageReceived).forEach((key) => {
                this.addArgument(key, this.messageReceiver.messageReceived[key]);
            });
        }
        this.addArgument('message', this.messageReceiver.messageReceived);
        this.addArgument(name, this.messageReceiver);
    }

    public trigger(): TestModel[] {
        Logger.trace(`Executing on message received`);
        if (!this.messageReceiver.onMessageReceived || !this.messageReceiver.messageReceived) {
            Logger.trace(`No onMessageReceived to be played here`);
            return [];
        }
        return this.execute().map(test => {
            return {name: test.label, valid: test.valid, description: test.errorDescription};
        });
    }
}