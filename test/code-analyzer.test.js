import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {getRefinedFunc} from '../src/js/refine';
import {getDot, getGreens} from '../src/js/dot';

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
    it('is converting first example', ()=>{
        let inputcodeToParse = 'function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;} else if (b < z * 2) {c = c + x + 5;} else {c = c + z + 5;}return c;}';
        let inputFunc = '(1,2,3)';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\n\nn3 [label="1) let a = x + 1;\nlet b = a + y;\nlet c = 0;" shape="box" style="filled" fillcolor="#2ca02c"]\nn4 [label="2) b < z" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn5 [label="3) c = c + 5" shape="box" style="filled" fillcolor="#ffffff"]\nn6 [label="" style="filled" fillcolor="#2ca02c"]\nn7 [label="5) b < z * 2" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn8 [label="6) c = c + x + 5" shape="box" style="filled" fillcolor="#2ca02c"]\nn9 [label="7) c = c + z + 5" shape="box" style="filled" fillcolor="#ffffff"]\n\n\n\n\n\n\nn3 -> n4 []\nn4 -> n5 [label="true"]\nn4 -> n7 [label="false"]\n\nn5 -> n6 []\n\n\nn7 -> n8 [label="true"]\nn7 -> n9 [label="false"]\n\nn8 -> n6 []\n\nn9 -> n6 []\n\n\nn99 [shape="box" label="4) return c;" shape="box" style="filled" fillcolor="#2ca02c" style="filled" fillcolor="#2ca02c"]\nn6 -> n99 []');
    });
    it('is converting second example', ()=>{
        let inputcodeToParse = 'function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;while (a < z) {c = a + b;z = c * 2;a++;}return z;}';
        let inputFunc = '(1,2,3)';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\n\nn3 [label="1) let a = x + 1;\nlet b = a + y;\nlet c = 0;" shape="box" style="filled" fillcolor="#ffffff"]\nn4 [label="2) a < z" shape="box" style="filled" fillcolor="#ffffff" shape="diamond"]\nn5 [label="3) c = a + b" shape="box" style="filled" fillcolor="#ffffff"]\nn6 [label="4) z = c * 2" shape="box" style="filled" fillcolor="#ffffff"]\nn7 [label="5) a++" shape="box" style="filled" fillcolor="#ffffff"]\nn8 [label="" style="filled" fillcolor="#ffffff"]\n\n\n\n\n\n\nn3 -> n4 []\nn4 -> n5 [label="true" shape="diamond"]\nn4 -> n8 [label="false" shape="diamond"]\n\nn5 -> n6 []\n\nn6 -> n7 []\n\nn7 -> n4 []\n\n\nn99 [shape="box" label="6) return z;" shape="box" style="filled" fillcolor="#ffffff" style="filled" fillcolor="#ffffff"]\nn8 -> n99 []');
    });
    it('is converting if else correctly', ()=>{
        let inputcodeToParse = 'function foo(x, y, z){let a = x[1];let b = a + y; if (b < z * 2) {b = b + x[1] + 5;} else if (b < z) {b = b + 5;} return b;}';
        let inputFunc = '([2,1,3],2,3)';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\nn2 [label="1) let a = x[1];\nlet b = a + y;" shape="box" style="filled" fillcolor="#2ca02c"]\nn3 [label="2) b < z * 2" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn4 [label="3) b = b + x[1] + 5" shape="box" style="filled" fillcolor="#2ca02c"]\nn5 [label="" style="filled" fillcolor="#2ca02c"]\nn6 [label="5) b < z" shape="diamond" style="filled" fillcolor="#ffffff"]\nn7 [label="6) b = b + 5" shape="box" style="filled" fillcolor="#ffffff"]\n\n\n\n\nn2 -> n3 []\n\nn3 -> n4 [label="true"]\nn3 -> n6 [label="false"]\n\nn4 -> n5 []\n\n\nn6 -> n7 [label="true"]\nn6 -> n5 [label="false"]\n\nn7 -> n5 []\n\n\nn99 [shape="box" label="4) return b;" shape="box" style="filled" fillcolor="#2ca02c" style="filled" fillcolor="#2ca02c"]\nn5 -> n99 []');
    });
    it('is converting while correctly', ()=>{
        let inputcodeToParse = 'function foo(x,y=1){x[1]=2;while(x[1]==x[2] && true){x[1]=4;}return null;}';
        let inputFunc = '([1,2])';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\nn1 [label="1) x[1]=2" shape="box" style="filled" fillcolor="#ffffff"]\nn2 [label="2) x[1]==x[2] && true" shape="box" style="filled" fillcolor="#ffffff" shape="diamond"]\nn3 [label="3) x[1]=4" shape="box" style="filled" fillcolor="#ffffff"]\nn4 [label="" style="filled" fillcolor="#ffffff"]\n\n\nn1 -> n2 []\n\nn2 -> n3 [label="true" shape="diamond"]\nn2 -> n4 [label="false" shape="diamond"]\n\nn3 -> n2 []\n\n\n\nn99 [shape="box" label="4) return null;" shape="box" style="filled" fillcolor="#ffffff" style="filled" fillcolor="#ffffff"]\nn4 -> n99 []');
    });
    it('is converting complex if correctly', ()=>{
        let inputcodeToParse = 'function foo(x, y=[1,2], z=true){let res = 0;if (x > y[0] && x>y[1]){res = -1;}else if (true){res = (x > 2 || false);}return -1;}';
        let inputFunc = '(1,[1,2])';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\nn1 [label="1) let res = 0;" shape="box" style="filled" fillcolor="#2ca02c" shape="box" style="filled" fillcolor="#2ca02c"]\nn2 [label="2) x > y[0] && x>y[1]" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn3 [label="3) res = -1" shape="box" style="filled" fillcolor="#ffffff"]\nn4 [label="" style="filled" fillcolor="#2ca02c"]\nn5 [label="5) true" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn6 [label="6) res = (x > 2 || false)" shape="box" style="filled" fillcolor="#2ca02c"]\n\n\nn1 -> n2 []\nn2 -> n3 [label="true"]\nn2 -> n5 [label="false"]\n\nn3 -> n4 []\n\n\n\nn5 -> n6 [label="true"]\nn5 -> n4 [label="false"]\nn6 -> n4 []\n\n\nn99 [shape="box" label="4) return -1;" shape="box" style="filled" fillcolor="#2ca02c" style="filled" fillcolor="#2ca02c"]\nn4 -> n99 []');
    });

    it('is converting arrays and empty return correctly', ()=>{
        let inputcodeToParse = 'function foo(x,y,z){let a;let b=\'just\';let c = x;if (x[1]==y[1]){a++;++a;}return;}';
        let inputFunc = '([1,2],[1,3],\'dog\')';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\n\nn3 [label="1) let a;\nlet b=\'just\';\nlet c = x;" shape="box" style="filled" fillcolor="#2ca02c"]\nn4 [label="2) x[1]==y[1]" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn5 [label="3) a++" shape="box" style="filled" fillcolor="#ffffff"]\nn6 [label="4) ++a" shape="box" style="filled" fillcolor="#ffffff"]\nn7 [label="" style="filled" fillcolor="#2ca02c"]\n\n\n\n\nn3 -> n4 []\nn4 -> n5 [label="true"]\nn4 -> n7 [label="false"]\n\nn5 -> n6 []\nn6 -> n7 []\n\n\nn99 [shape="box" label="5) return;" shape="box" style="filled" fillcolor="#2ca02c" style="filled" fillcolor="#2ca02c"]\nn7 -> n99 []');
    });

    it('is converting special if correctly', ()=>{
        let inputcodeToParse = 'function f(x,y=1){if (x>4){x=3;y=2;}else if (x>1){x=3;y=3;}else{x=2;y=5;}do{x=1;}while(x==2);return;}';
        let inputFunc = '(0)';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\nn1 [label="1) x>4" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn2 [label="2) x=3" shape="box" style="filled" fillcolor="#ffffff"]\nn3 [label="3) y=2" shape="box" style="filled" fillcolor="#ffffff"]\nn4 [label="4) x=1" shape="box" style="filled" fillcolor="#2ca02c"]\nn5 [label="5) x==2" shape="box" style="filled" fillcolor="#2ca02c"]\nn6 [label="" style="filled" fillcolor="#2ca02c"]\nn7 [label="7) x>1" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn8 [label="8) x=3" shape="box" style="filled" fillcolor="#ffffff"]\nn9 [label="9) y=3" shape="box" style="filled" fillcolor="#ffffff"]\nn10 [label="10) x=2" shape="box" style="filled" fillcolor="#2ca02c"]\nn11 [label="11) y=5" shape="box" style="filled" fillcolor="#2ca02c"]\n\n\nn1 -> n2 [label="true"]\nn1 -> n7 [label="false"]\n\nn2 -> n3 []\n\nn3 -> n4 []\n\nn4 -> n5 []\n\nn5 -> n4 [label="true"]\nn5 -> n6 [label="false"]\n\n\nn7 -> n8 [label="true"]\nn7 -> n10 [label="false"]\n\nn8 -> n9 []\n\nn9 -> n4 []\n\nn10 -> n11 []\n\nn11 -> n4 []\n\n\nn99 [shape="box" label="6) return;" shape="box" style="filled" fillcolor="#2ca02c" style="filled" fillcolor="#2ca02c"]\nn6 -> n99 []');
    });

    it('is converting special if correctly', ()=>{
        let inputcodeToParse = 'function f(x, y=1){let a = x[1];let b = [1,2];let c = 0;return x[1] + c;}';
        let inputFunc = '([1,2,3])';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\n\nn3 [label="1) let a = x[1];\nlet b = [1,2];\nlet c = 0;" shape="box" style="filled" fillcolor="#ffffff"]\nn4 [label="" style="filled" fillcolor="#ffffff"]\n\n\n\n\n\nn3 -> n4 []\n\n\n\nn99 [shape="box" label="2) return x[1] + c;" shape="box" style="filled" fillcolor="#ffffff" style="filled" fillcolor="#ffffff"]\nn4 -> n99 []');
    });

    it('is converting vars assignment', ()=>{
        let inputcodeToParse = 'function f(x){let a = [1,2,3];let b = a;return a;}';
        let inputFunc = '(1)';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\nn2 [label="1) let a = [1,2,3];\nlet b = a;" shape="box" style="filled" fillcolor="#ffffff"]\nn3 [label="" style="filled" fillcolor="#ffffff"]\n\n\n\nn2 -> n3 []\n\n\nn99 [shape="box" label="2) return a;" shape="box" style="filled" fillcolor="#ffffff" style="filled" fillcolor="#ffffff"]\nn3 -> n99 []');
    });
});
