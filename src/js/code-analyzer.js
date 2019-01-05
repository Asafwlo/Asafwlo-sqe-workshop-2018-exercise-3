import * as esprima from 'esprima';
import { FunctionDeclaration, Loop, If, AssignmentExpression, VariableDeclarator, ReturnStatement, UpdateExpression } from './model';
import { isNumber } from 'util';
const esgraph = require('esgraph');

var table;
var stopLine = false;
var func = [];
var variables = {};
var values = {};
var alternate = false;
var tempVars = {};
var globals = [];
var isGlobals = true;
var globalVars = [];
var doneAss = false;
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const cfgCode = (codeToParse) => {
    let p = esprima.parseScript(codeToParse,{ range: true });
    return esgraph(p.body[0].body);
};

const objectTable = (parsedCode) => {
    table = { 'Rows': [] };
    func = [];
    globals = [];
    isGlobals = true;
    variables = {};
    values = {};
    globalVars = {};
    doneAss = false;
    createObjectTable(parsedCode);
    createFunction();
    replaceGlobals();
    fixValues();
    return { 'func': func, 'values': values };
};

function replaceGlobals(){
    for (var i in values){
        if (i in globalVars)
            values[i] = globalVars[i];
    }
}

function fixValues(){
    for (var i in values)
        if(typeof(values[i]) === 'string' && values[i][0]=='[')
        {
            var vals = values[i].substring(1, values[i].length-1).split(',');
            for (var j = 0; j < vals.length; j++)
                insertToValues(i, j, vals[j]);
        }
        else
            values[i] = valuesToType(values[i]);
}

function insertToValues(i, j, v)
{
    //if (!((i + '_' + j + '_') in values))
    values[i + '_' + j + '_'] = valuesToType(v);        
}

function valuesToType(v){
    if (v == 'true')
        return true;
    if (v == 'false')
        return false;
    if (!isNaN(v))
        return parseInt(v);   
    if (v.includes('\''))
        return v.split('\'')[1];
    return v;
}

function insertToFunc(row) {
    func.push(row);
}

function handleFD(row, index) {
    isGlobals = false;
    var s = 'function ' + row.name + '(';
    for (var i = 0; i < row.params.length; i++) {
        globals.push(row.params[i].name);
        s += row.params[i].name + ', ';
        if (row.params[i].hasOwnProperty('value'))    
            if (!(row.params[i].name in values)){
                values[row.params[i].name] = row.params[i].value;
                globalVars[row.params[i].name] = row.params[i].value;
            }
    }
    s = s.substring(0, s.length - 2) + ') {';
    insertToFunc(s);
    return index;
}

function handleAE(row, index) {
    if (isNaN(row.value))
        replaceVariables(row);
    else{
        values[row.name] = row.value;
        if (!doneAss)
            globalVars[row.name] = row.value;
    }
    if (globals.indexOf(row.name.split('[')[0]) > -1){
        insertToFunc(row.name + ' = ' + row.value + ';');
        values[row.name] = row.value;
        if (!doneAss)
            globalVars[row.name] = row.value;
    }
    return index;
}

function isArray(text)
{
    if (text[0] == '[' && text[text.length-1] == ']')
        return true;
    return false;
}

function replaceVars(a, b, text) {
    if (!isArray(b)){
        text = text.replaceAll(a, b);
        text = removeZero(text);
    }
    else
    {
        //var start = text.substring(text.indexOf(a), text.indexOf(']', text.indexOf(a))+1);
        var pos = b.substring(1,b.length-1).split(',');
        var v = '[' + pos.join(',') + ']';
        text = v + ';';
        text = removeZero(text);
    }
    return text;
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function setRowValue(row, features, i) {
    if (row.value.indexOf(features[i]) < row.value.length - 1 && (row.value[row.value.indexOf(features[i]) + 1] == '*' || row.value[row.value.indexOf(features[i]) + 1] == '/'))
        row.value = replaceVars(features[i], '(' + variables[features[i]] + ')', row.value);
    else
        row.value = replaceVars(features[i], variables[features[i]], row.value);
    return row.value;
}

function removeZero(v)
{
    //var regBoth = /(\+|\/|-|\*)0(\+|\/|-|\*)/g;
    var regLeft = /(\+|\/|-|\*)0/g;
    //var regRight = /0(\+|\/|-|\*)/g;
    //if (v.match(regBoth)) {
    //    v = v.replace(regBoth, '');
    //}
    if (v.match(regLeft)) {
        v = v.replace(regLeft, '');
    }
    //if (v.match(regRight)) {
    //    v = v.replace(regRight, '');
    //}
    if (v[0]=='0' && v.length > 1 && v[1]!='.')
        v = v.substring(2);
    return v;
}

function replaceVariables(row) {
    var features = row.value.match(/(\w+)/g);
    for (var i in features)
        if (features[i] in variables) {
            row.value = setRowValue(row, features, i);
            variables[row.name] = row.value;
        }
        else if (isGlobals){
            values[row.name] = row.value;
            if (!doneAss)
                globalVars[row.name] = row.value;
        }
        else
            variables[row.name] = row.value;
    return row.value;
}

function handleVD(row, index) {
    if (row.hasOwnProperty('value')) {
        if (isNaN(row.value) && !row.value.includes('['))
            row.value = replaceVariables(row);
        else
            inserGlobaltToValues(row);
            
    }
    if (isGlobals)
        globals.push(row.name);
    return index;
}

function inserGlobaltToValues(row){
    if (isGlobals){
        values[row.name] = row.value;
        globalVars[row.name] = row.value;
    }
    else {
        if (row.value.includes('['))
            values[row.name] = row.value;
        variables[row.name] = row.value;
    }
}

function handleRS(row, index) {
    if (typeof(row.value) == 'string' && globals.indexOf(row.value) < 0) {
        var features = row.value.match(/(\w+)/g);
        for (var i in features)
            if (features[i] in variables)
                row.value = replaceVars(features[i], variables[features[i]], row.value);
    }
    insertToFunc('return ' + row.value + ';');
    return index;
}

function handleCases(type, obj, index) {
    switch (type) {
    case 'Function Declaration':
        return handleFD(obj, index);
    case 'Assignment Expression':
        return handleAE(obj, index);
    case 'Variable Declaration':
        return handleVD(obj, index);
    default:
        return handleStatements(type, obj, index);
    }
}

function handleStatements(type, obj, index) {
    doneAss = true;
    switch (type) {
    case 'Return Statement':
        return handleRS(obj, index);
    case 'WhileStatement':
        return handleWS(obj, index);
    default:
        return handleIfCases(type, obj, index);
    }
}

function handleIfCases(type, obj, index) {
    switch (type) {
    case 'If Statement':
        return handleIS(obj, index);
    case 'else':
        return handleES(obj, index);
    case 'Else If Statement':
        return handleEIS(obj, index);
    }
}

function handleES(row, index) {
    var first = true;
    insertToFunc('else {');
    variables = tempVars;
    index = bodyIterator(index, first);
    insertToFunc('}');
    return index;
}

function bodyIterator(index, first) {
    while (index < table.Rows.length - 1 && isB(index, first)) {
        index++;
        first = false;
        index = handleCases(table.Rows[index].obj.type, table.Rows[index].obj, index);
    }
    return index;
}

function handleEIS(row, index) {
    variables = tempVars;
    var first = true;
    var features = row.condition.match(/(\w+)/g);
    for (var i in features)
        if (features[i] in variables)
            row.condition = replaceVars(features[i], variables[features[i]], row.condition);
    insertToFunc('}');
    insertToFunc('else if (' + row.condition + ') {');
    tempVars = JSON.parse(JSON.stringify(variables));
    return bodyIterator(index, first);
}

function handleWS(row, index) {
    var first = true;
    var features = row.condition.match(/(\w+)/g);
    for (var i in features)
        if (features[i] in variables)
            row.condition = replaceVars(features[i], variables[features[i]], row.condition);
    func.push('while (' + row.condition + ') {');
    while (isB(index, first)) {
        index++;
        first = false;
        index = handleCases(table.Rows[index].obj.type, table.Rows[index].obj, index);
    }
    func.push('}');
    return index;
}

function isB(index, first)
{
    if (index+1<table.Rows.length && (table.Rows[index + 1].hasOwnProperty('belong') || first))
        return true;
    return false;
}

function handleIS(row, index) {
    var first = true;
    var features = row.condition.match(/(\w+)/g);
    for (var i in features)
        if (features[i] in variables && globals.indexOf(features[i])<0)
            row.condition = replaceVars(features[i], variables[features[i]], row.condition);
    insertToFunc('if (' + row.condition + ') {');
    tempVars = JSON.parse(JSON.stringify(variables));
    index = bodyIterator(index, first);
    insertToFunc('}');
    return index;
}

function createFunction() {
    for (let index = 0; index < table.Rows.length; index++) {
        index = handleCases(table.Rows[index].obj.type, table.Rows[index].obj, index);
    }
    insertToFunc('}');
}

function isElseIf(obj) {
    if (obj !== null && obj.type === 'IfStatement') {
        obj.type = 'Else If Statement';
        return 'ifElse';
    }
    else if (obj !== null) {
        return 'else';
    }
    else
        return 'if';

}
function bodyType(obj) {
    if (obj.hasOwnProperty('body'))
        return 'body';
    else if (obj.hasOwnProperty('alternate')) {
        return isElseIf(obj.alternate);
    }
    return '';
}

function IfBody(obj) {
    if (obj.type === 'BlockStatement')
        return obj;
    else
        return [obj];
}

function handleBody(obj) {
    switch (bodyType(obj)) {
    case 'body':
        createObjectTable(obj.body);
        break;
    case 'ifElse':
        createObjectTable(IfBody(obj.consequent));
        stopLine = false;
        createObjectTable(IfBody(obj.alternate));
        break;
    case 'else':
        createElseObjectTable(obj);
        break;
    case 'if':
        createObjectTable(IfBody(obj.consequent));
        break;
    default:
        break;
    }
}

function createElseObjectTable(obj) {
    createObjectTable(IfBody(obj.consequent));
    alternate = true;
    table.Rows.push({ 'obj': { 'type': 'else' } });
    createObjectTable(IfBody(obj.alternate));
}

function Contains(obj) {
    var list = ['WhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'If Statement', 'Else If Statement', 'IfStatement', 'else'];
    if (list.indexOf(obj.type) >= 0 || alternate) {
        alternate = false;
        return true;
    }
    return false;
}

function isBelong(index) {
    if (table.Rows.length > 0 && table.Rows[table.Rows.length - 1].hasOwnProperty('belong') && index == 0)
        stopLine = true;
}

function addToTable(newObj, obj) {
    if (stopLine)
        table.Rows.push({ 'obj': newObj, 'belong': true });
    else
        table.Rows.push({ 'obj': newObj });
    if (Contains(obj))
        stopLine = true;
}

export function createObjectTable(obj) {
    if (obj.hasOwnProperty('length')) {
        for (var index = 0; index < obj.length; index++) {
            isBelong(index);
            var newObj = ExtractElements(obj[index]);
            if (!isNumber(newObj)) {
                addToTable(newObj, obj[index]);
                handleBody(obj[index]);
            }
        }
        stopLine = false;
    }
    else {
        createObjectTable(obj.body);
    }
}

function ExtractElements(obj) {
    switch (obj.type) {
    case 'VariableDeclaration':
        for (var index = 0; index < obj.declarations.length; index++)
            table.Rows.push({ 'obj': new VariableDeclarator(obj.declarations[index]) });
        break;
    case 'ExpressionStatement':
        return ExtractElement(obj.expression);
    case 'ReturnStatement':
        return new ReturnStatement(obj);
    default:
        return ExtractElement(obj);
    }
    return 0;
}

// function isLoop(obj) {
//     var loopDic = ['WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement'];
//     if (loopDic.indexOf(obj.type) >= 0)
//         return true;
// }

function isIf(obj) {
    var ifDic = ['IfStatement', 'Else If Statement'];
    if (ifDic.indexOf(obj.type) >= 0)
        return true;
}

function ExtractElement(obj) {
    if (obj.type === 'FunctionDeclaration')
        return new FunctionDeclaration(obj);
    if (obj.type === 'AssignmentExpression')
        return new AssignmentExpression(obj);
    if (obj.type === 'UpdateExpression')
        return new UpdateExpression(obj);
    else
        return ExtractSpecial(obj);
}

function ExtractSpecial(obj) {
    if (isIf(obj))
        return new If(obj);
    //if (isLoop(obj))
    //if (obj.type == 'UpdateExpression')
    //  return new AssignmentExpression({'type':'AssignmentExpression', 'left': obj.argument, 'right': {'type': 'Literal', 'raw': obj.argument.name + '++'}});
    return new Loop(obj);
    //return 0;
}

export { cfgCode, parseCode, objectTable };
