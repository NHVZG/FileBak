

function testable(target) {
    target.prototype.isTestable = 123;
}

function aop(target,name,descriptor){
    let originalValue = descriptor.value;
    descriptor.value=function(...args) {
        console.log('before');
        let result = originalValue.apply(this, args);
        console.log('after');
        return result;
    }
}

@testable
class MyTestableClass {

    @aop
    test(){
       console.log('test');
    }

}


export {MyTestableClass}