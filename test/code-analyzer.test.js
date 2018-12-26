import assert from 'assert';
import {parseCode, objectTable} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });
});

describe('The convertion from parsed data to models object',()=>{
    it('is converting simple variable declaration correctly', ()=>{
        var codeToParse = 'let x=2;function foo(x) {let a = x; return a;}';
        var inputFunc = 'foo(2)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x) {","return x;","}"],"values":{"x":2}}');
    });
    it('is converting simple if correctly', ()=>{
        var codeToParse = 'let x=2;function foo(x){let a = x;if (a<3){return a+1;}return a;}';
        var inputFunc = 'foo(2)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x) {","if (x<3) {","return x+1;","}","return x;","}"],"values":{"x":2}}');
    });
    it('is converting simple if else correctly', ()=>{
        var codeToParse = 'let x=2;function foo(x){let a = x + 1;if (a < 3) {return a;} else {return a+2;}}';
        var inputFunc = 'foo(2)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x) {","if (x+1<3) {","return x+1;","}","else {","return x+1+2;","}","}"],"values":{"x":2}}');
    });
    it('is converting simple if else if correctly', ()=>{
        var codeToParse = 'let x=2;function foo(x){let a = x + 1;if (a < 3) {return a;} else if (a >= 3) {return a+2;}}';
        var inputFunc = 'foo(2)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x) {","if (x+1<3) {","return x+1;","}","else if (x+1>=3) {","return x+1+2;","}","}"],"values":{"x":2}}');
    });
    it('is converting complex if function correctly', ()=>{
        var codeToParse = 'let x=1;let y=2;let z=3;function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else if (b < z * 2) {c = c + x + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}';
        var inputFunc = 'foo(1,2,3)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x, y, z) {","if (x+1+y<z) {","return x+y+z+5;","}","else if (x+1+y<z*2) {","return x+y+z+x+5;","}","else {","return x+y+z+z+5;","}","}"],"values":{"x":1,"y":2,"z":3}}');
    });
    it('is converting simple while function correctly', ()=>{
        var codeToParse = 'let x=1;let y=2;let z=3;function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;while (a < z) {c = a + b;z = c * 2;}        return z;}';
        var inputFunc = 'foo(1,2,3)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x, y, z) {","while (x+1<z) {","z = (x+1+x+1+y)*2;","}","return z;","}"],"values":{"x":1,"y":2,"z":"(x+1+x+1+y)*2"}}');
    });

    it('is converting simple array correctly', ()=>{
        var codeToParse = 'let x=[1,2,3];function foo(x){a = x[2] + 1;if (a < 5){return x[1];}}';
        var inputFunc = 'foo([1,2,3])';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x) {","if (x[2]+1<5) {","return x[1];","}","}"],"values":{"x":"[1,2,3]","x_0_":1,"x_1_":2,"x_2_":3}}');
    });
    it('is converting complex complex If statement correctly2', ()=>{
        var codeToParse = 'let a=true;let b=false;function foo(a, b){if(true||(a&&b)){return true;}if(!true){return false;}}';
        var inputFunc = 'foo(true, false)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(a, b) {","if (true||a&&b) {","return true;","}","if (!true) {","return false;","}","}"],"values":{"a":true,"b":false}}');
    });
    it('is converting defualt value and string correctly', ()=>{
        var codeToParse = 'let x=\'2\';function foo(x,y=false){if (y && x==\'2\')return true;}';
        var inputFunc = 'foo(\'2\')';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x, y) {","if (y&&x==\'2\') {","return true;","}","}"],"values":{"x":"2","y":false}}');
    });
    it('is converting empty assignment and default dec correctly', ()=>{
        var codeToParse = 'let x=[1,2];let y=false;function foo(x, y=true){x[1] = 3;let b;let a = 0;let c = 5+a;if (x[1]==3){return c;}}';
        var inputFunc = 'foo([1,2], false)';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x, y) {","x[1] = 3;","if (x[1]==3) {","return 5;","}","}"],"values":{"x":"[1,2]","y":false,"x[1]":3,"x_0_":1,"x_1_":2}}');
    });
    it('is converting while and array correctly', ()=>{
        var codeToParse = 'let x=[2,1];function foo(x){let a = [1,2];if (x[0]==a[1]){while(true){return true;}}return;}';
        var inputFunc = 'foo([2,1])';
        var parsed = parseCode(codeToParse);
        var data = objectTable(parsed);
        assert.equal(JSON.stringify(data),'{"func":["function foo(x) {","if (x[0]==2) {","while (true) {","return true;","}","}","return null;","}"],"values":{"x":"[2,1]","a":"[1,2]","x_0_":2,"x_1_":1,"a_0_":1,"a_1_":2}}');
    });
    
});
