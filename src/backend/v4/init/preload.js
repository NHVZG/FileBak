//% 浏览器预加载（暴露给网页的调用main进程的api）
import {bridge} from "./bridge.js";
import {initBefore} from "@/backend/v4/init/init";

//. 渲染线程和主线程变量不共享，扫描两次注解
(async function(){
    await initBefore();
    bridge.preload();
})();

