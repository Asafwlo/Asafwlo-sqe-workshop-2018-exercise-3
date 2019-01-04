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

        assert.equal(dot,'\n\n\nn3 [label="let a = x + 1;\nlet b = a + y;\nlet c = 0;" shape="box" style="filled" fillcolor="#2ca02c"]\nn4 [label="b < z" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn5 [label="c = c + 5" shape="box" style="filled" fillcolor="#ffffff"]\nn6 [label="" style="filled" fillcolor="#2ca02c"]\nn7 [label="b < z * 2" shape="diamond" style="filled" fillcolor="#2ca02c"]\nn8 [label="c = c + x + 5" shape="box" style="filled" fillcolor="#2ca02c"]\nn9 [label="c = c + z + 5" shape="box" style="filled" fillcolor="#ffffff"]\n\n\n\n\n\n\nn3 -> n4 []\nn4 -> n5 [label="true"]\nn4 -> n7 [label="false"]\n\nn5 -> n6 []\n\n\nn7 -> n8 [label="true"]\nn7 -> n9 [label="false"]\n\nn8 -> n6 []\n\nn9 -> n6 []\n\n\nn99 [shape="box" label="return c;" shape="box" style="filled" fillcolor="#2ca02c" style="filled" fillcolor="#2ca02c"]\nn6 -> n99 []');
    });
    it('is converting second example', ()=>{
        let inputcodeToParse = 'function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;while (a < z) {c = a + b;z = c * 2;a++;}return z;}';
        let inputFunc = '(1,2,3)';
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        let gList = getGreens(parsedCode);
        let dot = getDot(inputcodeToParse, gList);

        assert.equal(dot,'\n\n\nn3 [label="let a = x + 1;\nlet b = a + y;\nlet c = 0;" shape="box" style="filled" fillcolor="#ffffff"]\nn4 [label="a < z" shape="box" style="filled" fillcolor="#ffffff" shape="diamond"]\nn5 [label="c = a + b" shape="box" style="filled" fillcolor="#ffffff"]\nn6 [label="z = c * 2" shape="box" style="filled" fillcolor="#ffffff"]\nn7 [label="a++" shape="box" style="filled" fillcolor="#ffffff"]\nn8 [label="" style="filled" fillcolor="#ffffff"]\n\n\n\n\n\n\nn3 -> n4 []\nn4 -> n5 [label="true" shape="diamond"]\nn4 -> n8 [label="false" shape="diamond"]\n\nn5 -> n6 []\n\nn6 -> n7 []\n\nn7 -> n4 []\n\n\nn99 [shape="box" label="return z;" shape="box" style="filled" fillcolor="#ffffff" style="filled" fillcolor="#ffffff"]\nn8 -> n99 []');
    });
});
