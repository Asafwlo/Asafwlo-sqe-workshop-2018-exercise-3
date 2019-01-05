
export function getRefinedFunc(inputFunc, inputcodeToParse){
    return replaceParams(inputFunc, inputcodeToParse);
}

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
        if (!cparams[index].includes('=')){
            indexV++;
            continue;
        }
        let inputText = setInputParams(cparams, index);
        let vars = inputText.split(';')[0];
        var res = getVName(cparams, indexV);
        indexV = parseInt(res.split(';')[1]) + 1;
        index = inputText.split(';')[1];
        if (res.split(';')[0] in been)
            continue;
        code = 'let ' + vars + ';' + code;
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
    if (v[index].includes('=')){
        res = v[index].split('=')[0].trim();
        if (v[index].includes('['))
            while (index < v.length && !v[index].includes(']'))
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