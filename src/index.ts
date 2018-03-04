import {RequisitionReader} from "./reader/requisition-reader";
import {FolderRequisitionReader} from "./reader/folder-requisition-reader";
import {StandardInputReader} from "./reader/standard-input-reader";
import {UdsReader} from "./reader/uds-reader";
import {Enqueuer} from "./runner/enqueuer";

let requisitionReaders: RequisitionReader[] = [];

//Multi-injection from inversify?
requisitionReaders.push(new FolderRequisitionReader());
requisitionReaders.push(new StandardInputReader());
requisitionReaders.push(new UdsReader());

new Enqueuer().execute(requisitionReaders);


// const myFunction = (resolve: Function, reject: Function) => {
//     return resolve(4);
// }
//
// let promise: Promise<number> = new Promise(myFunction);
//
// promise.then(numero=>console.log(numero));
//
//
// function deuCerto(numero:number){};
//
// myFunction(deuCerto, ()=>{});