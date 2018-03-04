const whyIsNodeRunning = require('why-is-node-running') // should be your first require
import { RequisitionReader } from "../reader/requisition-reader";
import {RequisitionParser} from "../requisition/requisition-parser";
import {ReportReplierFactory} from "../report/replier/report-replier-factory";
import {RequisitionRunner} from "./requisition-runner";

export class Enqueuer {

    public execute(requisitionReaders: RequisitionReader[]): void {
        requisitionReaders.forEach((reader: RequisitionReader) => this.startReader(reader));
    }

    private startReader(reader: RequisitionReader) {
        reader.start()
            .then((requisitions: string) => {
                this.startService(requisitions);
                return this.startReader(reader); //runs again
            })
            .catch((err) => {
                console.error(err);
            });
    }

    private startService(requisition: string): void {
        try {
            const parsedRequisition: any = new RequisitionParser().parse(requisition);
            const requisitionRunner: RequisitionRunner = new RequisitionRunner(parsedRequisition);

            requisitionRunner.start((report: string) => {
                new ReportReplierFactory(report)
                    .createReportPublishers(parsedRequisition.reports)
                    .forEach( reportReplier => reportReplier.report(report));
                console.log("Requisition is over");
                
                // return this.startService(requisition); //Do it again
                // whyIsNodeRunning();
            });
        } catch (err) {
            console.error(err);
        }
}
}