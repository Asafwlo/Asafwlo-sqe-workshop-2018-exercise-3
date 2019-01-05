export class FunctionDeclaration{
    constructor(obj){
        this.type = 'Function Declaration';
        this.name = obj.id.name;
        this.params = [];
        for (var index = 0; index < obj.params.length;index++)
            this.params.push(new Param(obj.params[index]));
    }
}

class Param{
    constructor(obj){
        this.type = obj.type;
        switch (obj.type){
        case 'AssignmentPattern':
            this.name = setDeclaration(obj.left);
            this.value = setDeclaration(obj.right);
            break;
        case 'Identifier':
            this.name = obj.name;
            break;
        }
    }
}

function handleArrayExp(obj)
{
    var s='[';
    for (var i = 0; i<obj.elements.length; i++)
    {
        s += setDeclaration(obj.elements[i]) + ',';
    }
    s = s.substring(0,s.length - 1) + ']';
    return s;
}

function setDeclaration(obj){
    switch(obj.type){
    case 'Literal':
        return obj.raw;
    case 'Identifier':
        return obj.name;
    //case 'VariableDeclaration':
    //  var o = new VariableDeclarator(obj.declarations[0]); 
        //return o.name + '=' + o.value;
    default:
        return setDeclarationExpression(obj);
    }
}

function setDeclarationExpression(obj){
    switch(obj.type){
    case 'MemberExpression':
        return setDeclaration(obj.object) + '['+setDeclaration(obj.property)+']';
    case 'ArrayExpression':
        return handleArrayExp(obj);
    default:
        return ExtractArgument(obj);
    }
}

export class VariableDeclarator{
    constructor(obj){
        this.type = 'Variable Declaration';
        this.name = setDeclaration(obj.id);
        if (obj.hasOwnProperty('init') && obj.init != null)
            this.value = setDeclaration(obj.init);
    }
}

export class AssignmentExpression{
    constructor(obj){
        this.type = 'Assignment Expression';
        this.name = setDeclaration(obj.left);
        this.value = setDeclaration(obj.right);
    }
}

export class UpdateExpression{
    constructor(obj){
        this.type = 'Update Expression';
        this.name = setDeclaration(obj.argument);
        if (obj.prefix === false)
            this.value = this.name + obj.operator;
        else
            this.value = obj.operator + this.name;        
    }
}

function setDoWhileStatement(obj)
{
    return setDeclaration(obj.test.left) + obj.test.operator + setDeclaration(obj.test.right);
}

// function setForStatement(obj)
// {
//     if (obj.init === null)
//         var init = '';
//     else
//         init = setDeclaration(obj.init);
//     if (obj.test === null)
//         var test = '';
//     else
//         test = ExtractArgument(obj.test);
//     if (obj.update === null)
//         var update = '';
//     else
//         update = ExtractArgument(obj.update);
//     return init + ';' + test + ';' + update;
// }
// function setForInStatement(obj)
// {
//     return obj.left.name + ' in ' + obj.right.name;
// }

function getLoopCond(obj){
    //var whiles = ['WhileStatement','DoWhileStatement'];
    //var forIns = ['ForOfStatement','ForInStatement'];
    //if (whiles.indexOf(obj.type) >= 0)
    return setDoWhileStatement(obj);
    //if (forIns.indexOf(obj.type) >= 0)
    //    return setForInStatement(obj);
    //else
    //    return setForStatement(obj);
}
export class Loop{
    constructor(obj){
        this.type = obj.type;
        this.condition = getLoopCond(obj);
    }
}

function getIfType(type){
    if (type === 'IfStatement')
        return 'If Statement';
    else
        return type;
}

function handleMemberExp(obj){
    return setDeclaration(obj.object) + '['+setDeclaration(obj.property)+']';
}
function handleIfCondition(obj){
    var left='';
    var right='';
    if (obj.test.left.type === 'MemberExpression'){
        //if (!obj.test.left.hasOwnProperty('name'))
        left = handleMemberExp(obj.test.left);
    }
    else
        left = setDeclaration(obj.test.left);
    if (obj.test.right.type === 'MemberExpression'){
        //if (!obj.test.right.hasOwnProperty('name'))
        right = handleMemberExp(obj.test.right);
    }
    else
        right = setDeclaration(obj.test.right);
    return left+obj.test.operator+right;
}

export class If{
    constructor(obj){
        this.type = getIfType(obj.type);
        if (obj.test.hasOwnProperty('left'))
        {
            this.condition = handleIfCondition(obj); 
        }
        else
        {
            this.condition = setDeclaration(obj.test);
        }
    }
}

function handleUnaryExpression(obj){
    var ans = '';
    ans = ans + obj.operator;
    ans = ans + setDeclaration(obj.argument);
    return ans;
}
function handleBinaryExpression(obj){
    var left = '', right = '';
    left = setDeclaration(obj.left);
    right = setDeclaration(obj.right);
    return left + obj.operator + right;
}

// function handleUpdateExpression(obj){
//     var ans = '';
//     ans = ans + setDeclaration(obj.argument);
//     if (obj.prefix === true)
//         ans = obj.operator + ans;
//     else
//         ans = ans + obj.operator;
//     return ans;
// }
function ExtractArgument(obj){
    switch(obj.type){
    case 'UnaryExpression':
        return handleUnaryExpression(obj);
    case 'BinaryExpression':
        return handleBinaryExpression(obj);
    case 'LogicalExpression':
        return handleBinaryExpression(obj);
    //case 'UpdateExpression':
      //  return handleUpdateExpression(obj);
    }
}
export class ReturnStatement{
    constructor(obj){
        this.type = 'Return Statement';
        if (obj.argument === null)
            this.value = 'null';
        else 
            this.value = setDeclaration(obj.argument);
    }
}