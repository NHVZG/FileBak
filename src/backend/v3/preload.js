import {exposeAPI} from './bridge.js';


//. 由于background.js 执行时，contextBridge仍未初始化，因此需分出文件 分步执行
exposeAPI();