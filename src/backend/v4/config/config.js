import fs from "fs";
import {resolvePublic} from "@/backend/v4/util/util";

let certPath=resolvePublic('certificate/server.cert');
let keyPath=resolvePublic('certificate/server.key');
let serverCert=fs.readFileSync(certPath);
let serverKey=fs.readFileSync(keyPath);

export {
    serverCert,
    serverKey
}
