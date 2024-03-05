import {CoverProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/CoverProcessor";
import {ExceptProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/ExceptProcessor";
import {IncrementProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/IncrementProcessor";
import {IncrementUpdateProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/IncrementUpdateProcessor";
import {RemoveProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/RemoveProcessor";
import {UpdateProcessor} from "@/backend/v7/common/service/fileDiff/rule/processor/UpdateProcessor";

const RULE_CONFIG = Object.freeze({
    except: Symbol({inherit: true, penetrate: true, order: 1}),                      //例外 - 穿透 覆盖其他规则
    remove: Symbol({inherit: true, penetrate: true, order: 2}),                     //删除 - 对远程路径操作
    //. 互斥规则
    update: Symbol({inherit: true, penetrate: false, order: 10}),                   //更新 - 仅覆盖已有
    increment: Symbol({inherit: true, penetrate: false, order: 11}),              //新增 - 仅新增文件
    incrementUpdate: Symbol({inherit: true, penetrate: false, order: 12}),   //更新+新增 - 两种模式的混合
    cover: Symbol({inherit: true, penetrate: false, order: 13}),                     //覆盖 - 完全与源文件路径一致，删除不在受控内的文件
});

const DISPATCH_CONFIG={
    [RULE_CONFIG.except]:ExceptProcessor,
    [RULE_CONFIG.remove]:RemoveProcessor,
    [RULE_CONFIG.update]:UpdateProcessor,
    [RULE_CONFIG.increment]:IncrementProcessor,
    [RULE_CONFIG.incrementUpdate]:IncrementUpdateProcessor,
    [RULE_CONFIG.cover]:CoverProcessor
};


export {
    RULE_CONFIG,
    DISPATCH_CONFIG,
}