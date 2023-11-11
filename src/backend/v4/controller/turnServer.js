import {api, request} from "@/backend/v4/decorator/api";
import {turnServer} from "@/backend/v4/core/service/webrtcContainor";

//% turn服务器
@api("turn")
class TurnServer{

    @request("startup")
    async startup(){
        return turnServer.startup();
    }

    @request("terminate")
    async terminate(){
        return turnServer.terminate();
    }

    @request("state")
    async state(){
        return turnServer.state();
    }

}