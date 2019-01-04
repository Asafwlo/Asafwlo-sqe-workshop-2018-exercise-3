import * as esgraph from 'esgraph';
import {cfgCode, objectTable} from './code-analyzer';
import {Parser} from 'expr-eval';



var greenList = [];
var greenNodes = [];
var whileNodes = [];
var ifNodes = [];
var white = '#ffffff';
var green = '#2ca02c';
var parser = new Parser({operators:{'in':true, '<':true, '>': true, '==': true, '!=': true, '<=': true, '>=': true}});


export function getDot(inputcodeToParse, gList){
    init();
    greenList = gList;
    var dotParsedCode = cfgCode(inputcodeToParse);
    getOtherGreens(dotParsedCode[2][0]);
    getWhiles(dotParsedCode[2][0]);
    let dot = createDot(dotParsedCode, inputcodeToParse);
    return dot;
}

function init(){
    greenList = [];
    greenNodes = [];
    ifNodes = [];
    whileNodes = [];
    white = '#ffffff';
    green = '#2ca02c';
}

function createDot(dotParsedCode, inputcodeToParse)
{
    if (greenList.length == 0)
        green = '#ffffff';
    let dot = esgraph.dot(dotParsedCode, { counter: 0, source: inputcodeToParse });
    dot = fixLines(dot);
    dot = paintOtherGreens(dot);
    dot = fixWhile(dot);
    dot = createEndNode(dot);
    return dot;
}

function removeFromReturn(lines, rNode){
    let first = true;
    for (let index = 0; index < lines.length; index++){
        if (lines[index].substring(0, lines[index].indexOf(' '))==rNode)
        {
            if (!first)
                lines[index] = '';
            else
                first = false;
        }
    }
    return lines;
}

function isWhile(cfgCode){
    if ('parent' in cfgCode && cfgCode.parent != undefined && 'type' in cfgCode.parent && cfgCode.parent.type == 'WhileStatement') 
        return true;
    return false;   
}

function getWhiles(cfgCode, nodeCounter = 0) {
    do {
        if (isWhile(cfgCode)) {
            if (!('been' in cfgCode)){
                cfgCode['been'] = 1;
                cfgCode = cfgCode.true;
                whileNodes.push('n' + nodeCounter);
            }
            else{
                cfgCode = cfgCode.false;
                nodeCounter--;
            }
        } else
            cfgCode = getNode(cfgCode.next);
        
        nodeCounter++;
    } while (cfgCode != undefined);
}

function isIf(cfgCode)
{
    if ('parent' in cfgCode && cfgCode.parent != undefined && 'type' in cfgCode.parent && cfgCode.parent.type == 'IfStatement') 
        return true;
    return false;
}

function getIfGreen(curr, counter, nextNodeCounter, nodeCounter, currName){
    if (greenList.indexOf(counter) > -1)
        curr = getNode(curr.true);
    else {
        nextNodeCounter = getOtherGreens(curr.true, false, nodeCounter + 1, counter+1);
        curr = getNode(curr.false);
    }
    if (currName != undefined)
        ifNodes.push(currName);
    else
        ifNodes.push('n' + nodeCounter);
    return [curr, nextNodeCounter];
}

function getOtherGreens(cfgCode, add = true, nodeCounter = 0, counter = 1){
    do {
        let nextNodeCounter = undefined;
        let currName = cfgCode.nodeName;
        if (currName == undefined)
            cfgCode['nodeName'] = 'n' + nodeCounter;
        if (isIf(cfgCode)) {
            let res = getIfGreen(cfgCode, counter, nextNodeCounter, nodeCounter, currName);
            cfgCode = res[0]; 
            nextNodeCounter = res[1]; 
            counter++;
        } else
            cfgCode = getNode(cfgCode.next);
        if (add)
            insertToGreenNodes(currName, nodeCounter);
        nodeCounter = setNodeCounter(nextNodeCounter, nodeCounter,currName);
    } while (cfgCode != undefined);
    return nodeCounter;
}

function insertToGreenNodes(currName, nodeCounter){
    if (currName != undefined)
        greenNodes.push(currName);
    else
        greenNodes.push('n' + nodeCounter);
}

function setNodeCounter(nextNodeCounter, nodeCounter,currName){
    if (nextNodeCounter != undefined)
        return nextNodeCounter;
    else if (currName == undefined)
        return ++nodeCounter;
    return nodeCounter;
}

function getNode(cfgItem)
{
    if ('astNode' in cfgItem)
        return cfgItem;
    else
        for (let index = 0; index < cfgItem.length; index++)
            if (cfgItem[index].astNode != undefined)
                return cfgItem[index];
    
    return undefined;
}

function paintOtherGreens(dot)
{
    let lines = dot.split('\n');
    for (let index = 0; index < lines.length; index++)
    {
        let node = lines[index].substring(0, lines[index].indexOf(' '));
        if (isGreenNodeLine(node, lines, index))
        {
            if (!lines[index].includes('fillcolor'))
                lines[index] = saveLine(node, lines, index);
            else
                lines[index] = lines[index].substring(0, lines[index].indexOf('fillcolor')) + 'fillcolor="'+green+'"]';
        }
        else if (isNodeLine(node, lines, index))
            lines[index] = makeSquare(lines, index);
    }
    return lines.join('\n');
}

function saveLine(node, lines, index)
{
    if (ifNodes.indexOf(node) > -1)
        return lines[index].substring(0, lines[index].indexOf(']')) + ' shape="diamond" style="filled" fillcolor="'+green+'"]';
    else
        return lines[index].substring(0, lines[index].indexOf(']')) + ' shape="box" style="filled" fillcolor="'+green+'"]';
}

function isGreenNodeLine(node, lines, index)
{
    if (greenNodes.indexOf(node) > -1 && lines[index].includes(']')  && lines[index].includes(node) && !lines[index].includes('->'))
        return true;
    return false;
}

function isNodeLine(node, lines, index)
{
    if (lines[index].includes(']')  && lines[index].includes(node) && !lines[index].includes('->') && lines[index][0] === 'n')
        return true;
    return false;

}

function makeSquare(lines, index)
{
    return lines[index].substring(0, lines[index].indexOf(']')) + ' shape="box" style="filled" fillcolor="'+white+'"]';
}

function exclude(lines, index){
    if (lines[index].includes('label="exception"') || lines[index].includes('exit') || lines[index].includes('n0'))
        return true;
    return false;
}

function fixWhile(dot){
    let lines = dot.split('\n');
    for (let index = 0; index < lines.length; index++){
        let node = lines[index].substring(0, lines[index].indexOf(' '));
        if (whileNodes.indexOf(node) > -1 && lines[index].includes(']'))
        {
            lines[index] = lines[index].substring(0, lines[index].length-1) + ' shape="diamond"]';
        }
    }
    return lines.join('\n');
}

function fixLines(dot){
    let lines = dot.split('\n');
    for (let index = 0; index < lines.length; index++)
        if (exclude(lines, index))
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

function createEndNode(dot)
{
    let lines = dot.split('\n');
    let label = '';
    let endNode = '???';
    for (let index = 0; index < lines.length; index++){
        if (lines[index].includes('return'))
            endNode = lines[index].substring(0, lines[index].indexOf(' '));
        if (lines[index].substring(0, lines[index].indexOf(' ')) == endNode){
            label = lines[index].substring(lines[index].indexOf('[')+1, lines[index].length-1);
            lines.push('n99 [shape="box" '+label+' style="filled" fillcolor="'+green+'"]');
            lines[index] = endNode + ' [label="" style="filled" fillcolor="'+green+'"]';  
            break;
        }
    }
    lines = removeFromReturn(lines, endNode);
    lines.push(endNode + ' -> ' + 'n99' + ' []');
    return lines.join('\n');
}

function removeNodes(lines, n)
{
    for (let index = 0; index < lines.length; index++)
        for (let jndex = 0; jndex < n.length-1; jndex++)
            if (lines[index].includes(n[jndex]))
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
            lines[index] = lines[index].substring(0, lines[index].indexOf('"')) + '"' + vs + '" shape="box" style="filled" fillcolor="'+green+'"]';
            break;
        }
    return [lines, index, n];
}

export function getGreens(parsedCode)
{
    init();
    let counter = 1;
    let functionJsoned = objectTable(parsedCode);
    let drawn = drawFunction(functionJsoned);
    let lines = drawn.split('</p>');
    for (let index = 0; index < lines.length; index++)
        if (lines[index].includes('green'))
        {
            greenList.push(counter);
            counter++;
        }
        else if (lines[index].includes('red'))
            counter++;
    return greenList;
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};




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