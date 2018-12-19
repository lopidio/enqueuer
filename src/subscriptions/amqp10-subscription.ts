import {Subscription} from './subscription';
import {Injectable} from 'conditional-injector';
import {SubscriptionModel} from '../models/inputs/subscription-model';
import {Protocol} from '../protocols/protocol';
import {Logger} from '../loggers/logger';

const container = require('rhea');

const protocol = new Protocol('amqp1')
    .addAlternativeName('amqp-1')
    .setLibrary('rhea')
    .registerAsSubscription();

@Injectable({predicate: (subscription: any) => protocol.matches(subscription.type)})
export class Amqp10Subscription extends Subscription {
    private rejectCallback = (event: string, err: any, reject: any) => reject(`AMQP-1 container emitter '${event}' event: ${err.error}`);

    constructor(subscriptionAttributes: SubscriptionModel) {
        super(subscriptionAttributes);
    }

    public receiveMessage(): Promise<any> {
        return new Promise((resolve, reject) => {
            container.once('message', (context: any) => {
                resolve(context.message);
                context.connection.close();
            });
            container.once('error', reject);
        });
    }

    public subscribe(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.registerFailures(reject);
            if (this.server === true) {
                const server = container.listen(this.connection);
                server.once('listening', resolve);
                server.once('connection', server.close);
                server.once('error', (err: any) => reject(err.error));
            } else {
                container.connect(this.connection);
                this.removeFailure();
            }
            container.once('connection_open', (context: any) => {
                Logger.info(`${this.type} connection opened`);
                this.removeFailure();
                context.connection.open_receiver(this.options);
                resolve();
            });
        });
    }

    private registerFailures(reject: any) {
        container.once('connection_close', (err: any) => this.rejectCallback('connection_close', err, reject));
        container.once('connection_error', (err: any) => this.rejectCallback('connection_error', err, reject));
        container.once('error', (err: any) => this.rejectCallback('error', err, reject));
        container.once('receiver_close', (err: any) => this.rejectCallback('receiver_close', err, reject));
    }

    private removeFailure() {
        container.removeAllListeners('connection_close');
        container.removeAllListeners('connection_error');
        container.removeAllListeners('error');
        container.removeAllListeners('receiver_close');
    }
}