import {Publisher} from './publisher';
import {PublisherModel} from '../models/inputs/publisher-model';
import {Injectable} from 'conditional-injector';
import {Logger} from '../loggers/logger';
import {KafkaClient, Producer} from 'kafka-node';
import {JavascriptObjectNotation} from '../object-notations/javascript-object-notation';

@Injectable({predicate: (publishRequisition: any) => publishRequisition.type === 'kafka'})
export class KafkaPublisher extends Publisher {
    private kafkaPayload: [{ topic: string; messages: string }];
    private client: KafkaClient;

    constructor(publisherProperties: PublisherModel) {
        super(publisherProperties);

        this.client = new KafkaClient(publisherProperties.client);
        this.kafkaPayload = [
            { topic: publisherProperties.topic, messages: this.payload }
        ];
    }

    public publish(): Promise<void> {
        return new Promise((resolve, reject) => {
            const producer = new Producer(this.client);
            Logger.trace(`Waiting for kafka publisher client connection`);
            // producer.on('ready', () => {
                Logger.trace(`Kafka publisher is ready`);
                    producer.send(this.kafkaPayload, (err: any, data: {}) => {
                    if (err) {
                        Logger.error(`Error sending kafka message ${new JavascriptObjectNotation().stringify(err)}`);
                        return reject(err);
                    }
                    Logger.trace(`Kafka publish message data ${new JavascriptObjectNotation().stringify(data)}`);
                    this.messageReceived = new JavascriptObjectNotation().stringify(data);
                    producer.close();
                    this.client.close();
                    resolve();
                });
            // });

            producer.on('error', (err: any) => {
                Logger.error(`Error on publishing kafka message ${new JavascriptObjectNotation().stringify(err)}`);
                producer.close();
                this.client.close();
                return reject(err);
            });
        });
    }

}
