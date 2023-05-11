import {render} from "./bridge";
import {dir, listDriver} from "./core/main/files";


function initMain2Render(initType){

}

function initRender2Main(initType){
    render('files',{
        dir:                              (base)=>dir(base),
        drivers:                        ()=>listDriver()
    })
}

function initFiles(initType){
    initRender2Main(initType);
}

export {initFiles}