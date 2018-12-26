import $ from 'jquery';
import {cfgCode, parseCode, objectTable} from './code-analyzer';
import {Parser} from 'expr-eval';
import * as esgraph from 'esgraph';
import Viz from 'viz.js';
import workerURL from 'viz.js/full.render.js';
import * as d3 from 'd3-graphviz';


var greenList = [];
var parser = new Parser({operators:{'in':true, '<':true, '>': true, '==': true, '!=': true, '<=': true, '>=': true}});

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let inputcodeToParse = $('#codePlaceholder').val();
        let inputFunc = document.getElementById('functionInput').value;
        let codeToParse = replaceParams(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        try{
            setGreens(parsedCode);
            var dotParsedCode = cfgCode(inputcodeToParse);
            let dot = esgraph.dot(dotParsedCode, { counter: 0, source: inputcodeToParse });
            dot = fixLines(dot);
            d3.graphviz('#outPutFunction').renderDot('digraph{'+dot+'}');
        } catch (error){
            throw new 'Invalid Input.';
        }
    });
});

function setGreens(parsedCode){
    let functionJsoned = objectTable(parsedCode);
    let drawn = drawFunction(functionJsoned);
    let lines = drawn.split('</p>');
    for (let index = 0; index < lines.length; index++)
        if (lines[index].includes('green'))
        {
            let s = lines[index].indexOf('>');
            let e = lines[index].indexOf('{', s);
            greenList.push(lines[index].substring(s+1, e-1));
        }
             
}
function fixLines(dot){
    let lines = dot.split('\n');
    for (let index = 0; index < lines.length; index++)
        if (lines[index].includes('label="exception"'))
            lines[index] = '';
        else if (lines[index].includes('let'))
        {
            let res = fixDecs(lines, index);
            index = res[1];
            lines = res[0];
            lines = removeNodes(lines, res[2]);
        }
    return lines.join('\n');
}

function removeNodes(lines, n)
{
    for (let index = 0; index < lines.length; index++)
        for (let jndex = 0; jndex < n.length-1; jndex++)
            if (lines[index].includes(n[jndex])||lines[index].includes('n0'))
                lines[index] = '';
    return lines;
}

function fixDecs(lines, index){
    let n = [];
    let vs = '';
    for (;index<lines.length;index++)
        if (lines[index].includes('let') && lines[index+1].includes('let'))
        {
            n.push(lines[index].substring(0, lines[index].indexOf(' ')));
            vs += lines[index].substring(lines[index].indexOf('label="')+7, lines[index].indexOf(';')+1) + '\n';
            lines[index] = '';
        }
        else {
            n.push(lines[index].substring(0, lines[index].indexOf(' ')));
            vs += lines[index].substring(lines[index].indexOf('label="')+7, lines[index].indexOf(';')+1);
            lines[index] = lines[index].substring(0, lines[index].indexOf('"')) + '"' + vs + '" shape="box" style="filled" fillcolor="#2ca02c"]';
            break;
        }
    return [lines, index, n];
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function replaceInputParams(cparams, iparams, code)
{
    var indexV=0;
    var been = {};
    for (let index=0;index<iparams.length;index++)
    {
        let inputText = setInputParams(iparams, index);
        let vars = inputText.split(';')[0];
        var res = getVName(cparams, indexV);
        been[res.split(';')[0]] = true; 
        indexV = parseInt(res.split(';')[1]) + 1;
        code = 'let ' + res.split(';')[0] + '=' + vars + ';' + code;
        index = inputText.split(';')[1];
    }
    return {'code':code,'been': been};
}

function replaceCodeParams(cparams, been, code){
    var indexV = 0;
    for (let index=0;index<cparams.length;index++)
    {
        if (!cparams[index].includes('='))
            continue;
        let inputText = setInputParams(cparams, index);
        let vars = inputText.split(';')[0];
        var res = getVName(cparams, indexV);
        indexV = parseInt(res.split(';')[1]) + 1;
        index = inputText.split(';')[1];
        if (res.split(';')[0] in been)
            continue;
        code = 'let ' + res.split(';')[0] + '=' + vars + ';' + code;
    }
    return code;
}

function replaceParams(input, code){
    var ci = code.indexOf('('),co = code.indexOf(')'),ii = input.indexOf('('),io = input.indexOf(')');
    var cparams = code.substring(ci+1,co).split(','), iparams = input.substring(ii+1,io).split(',');
    var been = {};
    var iRes = replaceInputParams(cparams, iparams, code);
    code = iRes.code;
    been = iRes.been;
    code = replaceCodeParams(cparams, been, code);
    return code;
}

function getVName(v, index){
    var res = '';
    if (v[index].includes('[')){
        res = v[index].split('=')[0].trim();
        while (!v.includes(']'))
            index++;
    }
    else
        res = v[index].trim();
    res += ';' + index;
    return res;
}

function setInputParams(input, index){
    var text = '';
    if (input[index].includes('[') && !input[index].includes(']'))
    {
        do {
            text += input[index].trim() + ',';
            index++;
        }
        while (!input[index].includes(']'));
        text += input[index].trim() + ';' + index;
        return text;
    }
    else
        return input[index].trim() + ';' + index;
}

function drawElseIf(funcObject, toPrint, parser, ifVal, color, row){
    var exp = funcObject.func[row].substring(9,funcObject.func[row].length-3);
    exp = exp.replace(/\[/g,'_').replace(/\]/g,'_').replace(/&&/g,' and ').replace(/\|\|/g,' or ');
    var sol = parser.evaluate(exp, funcObject.values);
    if (!ifVal && sol){
        color = 'green';
        ifVal = true;
    }
    else {
        color = 'red';
        ifVal = false;
    }
    toPrint += '<p class="'+color+'">'+funcObject.func[row].replace(/</g,' &lt; ').replace(/>/g,' &gt; ')+'</p>';
    while (funcObject.func[row+1] !== '}')
    {
        row++;
        toPrint += '<p>'+funcObject.func[row]+'</p>';
    }
    return {'toPrint': toPrint, 'ifVal': ifVal, 'row': row};
}

function drawElse(toPrint, ifVal, color, funcObject, row){
    if (ifVal)
        color = 'red';
    else
        color = 'green';
    toPrint += '<p class="'+color+'">'+funcObject.func[row]+'</p>';
    while (funcObject.func[row+1] !== '}')
    {
        row++;
        toPrint += '<p>'+funcObject.func[row]+'</p>';
    }
    return {'toPrint': toPrint, 'ifVal': ifVal, 'row': row};
}

function drawIf(sol, parser,color,ifVal, funcObject,toPrint, row){
    var exp = funcObject.func[row].substring(4,funcObject.func[row].length-3);
    exp = exp.replace(/\[/g,'_').replace(/\]/g,'_').replace(/&&/g,' and ').replace(/\|\|/g,' or ');
    sol = parser.evaluate(exp, funcObject.values);
    if (sol){
        color = 'green';
        ifVal = true;
    }
    else{
        color = 'red';
        ifVal = false;
    }
    toPrint += '<p class="'+color+'">'+funcObject.func[row].replace(/</g,' &lt; ').replace(/>/g,' &gt; ')+'</p>';
    while (funcObject.func[row+1] !== '}')
    {
        row++;
        toPrint += '<p>'+funcObject.func[row]+'</p>';
    }
    return {'toPrint': toPrint, 'ifVal': ifVal, 'row': row};
}

function drawFunction(funcObject){
    var toPrint = '', ifVal = false, sol, color;
    for (var row=0; row < funcObject.func.length; row++)
        if (funcObject.func[row].includes('else if')){
            let res = drawElseIf(funcObject, toPrint, parser, ifVal,color, row);
            toPrint = res.toPrint; ifVal = res.ifVal; row = res.row;
        } else if (funcObject.func[row].includes('else')){
            let res = drawElse(toPrint, ifVal, color, funcObject, row);
            toPrint = res.toPrint; ifVal = res.ifVal; row = res.row;
        } else if (funcObject.func[row].includes('if')){
            let res = drawIf(sol, parser,color, ifVal, funcObject, toPrint, row);
            toPrint = res.toPrint; ifVal = res.ifVal; row = res.row;
        }
        else
            toPrint += '<p>'+funcObject.func[row].replace(/</g,' &lt; ').replace(/>/g,' &gt; ')+'</p>';
    //document.getElementById('outPutFunction').innerHTML = toPrint;
    return toPrint;
}