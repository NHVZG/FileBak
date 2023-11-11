import Turn from "node-turn";
import {STATE} from "@/backend/v4/core/service/webrtcContainor";

class TurnServer{

    config(conf) {
        if(conf)this.conf=conf;
        return this;
    }

    startup(){
        if(this.server) this.terminate();

        this.server = new Turn({
            authMech: 'long-term',
            listeningPort: this.conf.port,
            credentials: {
                [this.conf.username]: this.conf.password
            }
        });
        this.server.start();
    }

    terminate(){
        this.server.stop();
        this.server=null;
    }

    state(){
        return this.server?STATE.TURN.RUNNING:STATE.TURN.CLOSED;
    }
}

export {TurnServer};