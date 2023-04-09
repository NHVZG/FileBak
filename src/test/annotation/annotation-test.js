

function testable(target) {
    target.prototype.isTestable = 123;
}

@testable
class MyTestableClass {}


export {MyTestableClass}