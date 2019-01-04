import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {getDot, getGreens} from './dot';
import {getRefinedFunc} from './refine';
import * as d3 from 'd3-graphviz';


var greenList = [];

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let inputcodeToParse = $('#codePlaceholder').val();
        let inputFunc = document.getElementById('functionInput').value;
        let codeToParse = getRefinedFunc(inputFunc, inputcodeToParse);
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        try{
            greenList = [];
            greenList = getGreens(parsedCode);
            let dot = getDot(inputcodeToParse, greenList);
            d3.graphviz('#outPutFunction').renderDot('digraph{'+dot+'}');
        } catch (error){
            throw new 'Invalid Input.';
        }
    });
});