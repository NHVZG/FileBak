import {api, listen, request} from "@/backend/v4/decorator/api";
import {serverCert,serverKey} from "@/backend/v4/config/config";
import {wsServer} from "@/backend/v4/core/service/webrtcContainor";

@api("wsServer")
class WsServer{


    @request("startup")
    startup(conf){
        wsServer.config({...conf,cert:serverCert,key:serverKey});
        return wsServer.startup();
    }

    @request("terminate")
    terminate(){
        return wsServer.terminate();
    }

    @request("state")
    state(){
        return wsServer.state();
    }

    /*@request("send")
    send(data,to){
        wsServer.send(data,to);
    }

    @listen()
    onWsServerMsgData(){}*/



}