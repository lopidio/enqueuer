import {EnqueuerExecutor} from "./enqueuer-executor";
import {Report} from "../reporters/report";
import {MultiPublisher} from "../publishers/multi-publisher";
import {SingleRunRequisitionInput} from "../requisitions/single-run-requisition-input";
import {Injectable} from "../injector/injector";
import {Configuration} from "../configurations/configuration";
import {RequisitionStarter} from "../requisitions/requisition-starter";
import {Logger} from "../loggers/logger";
const fs = require("fs");
const prettyjson = require('prettyjson');

@Injectable(enqueuerConfiguration => enqueuerConfiguration["single-run"])
export class SingleRunEnqueuerExecutor extends EnqueuerExecutor {

    private runningRequisitionsCounter = 0;
    private outputFilename: string;
    private multiPublisher: MultiPublisher;
    private singleRunRequisitionInput: SingleRunRequisitionInput;
    private reportMerge: Report;

    constructor(enqueuerConfiguration: any) {
        super();
        const singleRunConfiguration = enqueuerConfiguration["single-run"];
        this.outputFilename = singleRunConfiguration["output-file"];

        this.multiPublisher = new MultiPublisher(new Configuration().getOutputs());
        this.singleRunRequisitionInput =
            new SingleRunRequisitionInput(singleRunConfiguration.fileNamePattern);

        this.reportMerge = {
            valid: true,
            errorsDescription: [],
            requisitions: {}
        }
    }

    public execute(): Promise<Report> {
        return new Promise((resolve) => {
            this.singleRunRequisitionInput.receiveRequisition()
                .then(requisition => {
                    this.multiPublisher.publish(JSON.stringify(requisition, null, 2)).then().catch(console.log.bind(console));

                    ++this.runningRequisitionsCounter;
                    new RequisitionStarter(requisition).start()
                        .then(report => {
                            --this.runningRequisitionsCounter;
                            Logger.info(`Remaining requisitions to receive report: ${this.runningRequisitionsCounter}`);

                            this.mergeNewReport(report, requisition.id);

                            resolve(this.execute()); //Run the next one
                        }).catch(console.log.bind(console));;
                })
                .catch(() => {
                    Logger.info("There is no more requisition to be ran");
                    this.summary(this.reportMerge);
                    resolve(this.reportMerge)
                })
        });
    }

    private mergeNewReport(newReport: Report, id: string): void {
        this.reportMerge.requisitions[id] = newReport.valid;
        this.reportMerge.valid = this.reportMerge.valid && newReport.valid;
        newReport.errorsDescription.forEach(newError => {
            this.reportMerge.errorsDescription.push(`[Requisition][${id}]${newError}`)
        })
    }

    private summary(report: Report) {
        const options = {
            defaultIndentation: 4,
            keysColor: "white",
            dashColor: "grey"
        };
        Logger.info(`Reports summary:`)
        console.log(prettyjson.render(report, options));
        fs.writeFileSync(this.outputFilename, JSON.stringify(report, null, 3));
    };

}