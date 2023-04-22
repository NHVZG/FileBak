
function __res(){
    let res={};
    let struct= {
        success:msg=>{res.success=success;return struct},
        code:code=>{res.code=code;return struct},
        data:data=>{res.data=data;return struct},
        msg:msg=>{res.msg=msg;return struct},
        result:(success)=>{
            return success?
                (data,msg)=>{
                    res={code:1,msg:msg||'success',data,success};
                    return struct;
                }:
                (msg,code,data)=>{
                    res={code:code===undefined?-1:code,msg:msg||'fail',data,success};
                    return struct;
                };
        },
        get:()=>res
    };

    return struct;
}


function __flat(...func){
    return (...arg)=>{
        let res;
        for(let f of func){
            if(!f)continue;
            res=f(...arg);
        }
        return res;
    }
}

//` 数据构建
function __data(){
    return{
        signed:(clientID)=>({type: 'signed',from:'server',to:clientID,clientID}),
        message:(message,from,to)=>({type:'message',from,to,message}),
        data:(type,data,from,to)=>({type,from,to,data})
    }
}



export {
    __flat,
    __res,
    __data
}