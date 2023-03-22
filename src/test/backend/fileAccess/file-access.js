import {WebSocketServer}   from 'ws';
import { app} from 'electron'
import * as fs from "fs";
import path from 'path';


//const keyFilePath='../../public/certificate/server.key';
//const certFilePath='../../public/certificate/server.cert';
const keyFilePath='certificate/server.key';
const certFilePath='certificate/server.cert';


function fileAccess() {
    try {
        /*if (process.env.NODE_ENV !== 'development') {
            global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
        }*/
        let a=path.resolve(__static,keyFilePath);
        fs.readFileSync(path.resolve(__static,keyFilePath));
        fs.readFileSync(path.resolve(__static,certFilePath));
        return 1;
    } catch (err) {
        console.log('certificate loss');
        return 123;
    }
}

export {fileAccess};

// const webSocketServer=new WebSocketServer({
//
// });