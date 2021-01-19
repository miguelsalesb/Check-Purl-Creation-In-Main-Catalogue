var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var file = fs.createWriteStream('report.csv', 'latin1');

file.on('error', function (err) {
    "Error!";
});

var header = "NCB, PURL, FREE ACCESS,,,,INTERNAL ACCESS,,," + "\n" + ",,856:40, 856:41, 856:49, 958, 856:40, 856:41, 958, 997" + "\n";
file.write(header);
var data = '';
var readStream = fs.createReadStream('purl.txt');

readStream.on('data', function (chunk) {
    data += chunk;
}).on('end', function () {
    writeFile(data);

});

function writeFile(data) {
    
    var dataRecords = [];
    dataRecords = data.split("(");
    var records = [];
    var records_purl = [];
    
    dataRecords.forEach(function (element) {

        var end = element.indexOf(")");
        var split = element.split(")").shift();
        var begin = split.indexOf(':');
        var ncb_file = split.slice(begin + 2, end);
    
        if (element.indexOf('NCB') >= 0) {
            records.push(ncb_file);
        }
        var split_purl = element.split("/").pop();
        split_purl = split_purl.split(" ").shift();
    
        if (element.indexOf('http') >= 0) {
            records_purl.push(split_purl);
        }
    });
    
    var _loop_1 = function (purl) {
        var len = records.length;
        setTimeout(function timer() {
            // If last record - stops writing data in file
            if (purl == len) {
                file.end();
            }
            writeReport(records_purl[purl], records[purl]);
            console.log((purl + 1) + " of " + len + " records - NCB: " + records[purl]);
        }, purl * 500);
    };
    
    for (var purl = 0; purl < records.length; purl++) {
        _loop_1(purl);
    }
    
    function writeReport(purl, ncb) {
    
        // PURL URL to get the Unimarc data in XML format
        var url = "BIBLIOGRAPHIC UNIMARC REPOSITORY URL" + ncb;
    
        request(url, function (err, resp, body) {
            var $ = cheerio.load(body);
            var field001 = $('controlfield').eq(0).text();
    
            if (field001 == undefined) {
                console.log(ncb);
            }
    
            file.write(ncb /*+ ',' + purl + ','*/);
            file.write(',' + purl /*+ ',' + purl + ','*/);
    
            var noOfFields = $('datafield').length;
            
            function verify85640(field, ind1, ind2) {
    
                var testField = '0';
    
                for (var fld = 0; fld < noOfFields; fld++) {
                    var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                    for (var sf = 0; sf < numberOfSubFields; sf++) {
    
                        if (($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) &&
                            ($('datafield').eq(fld).attr('ind2') == ind2)) {
                            testField = '1';
                            break;
                        }
                    }
                }
                if (testeField == '0') {
                    file.write(',Doesn\'t exist');
                }
                else {
                    verify85640_continue();
                }
                
                function verify85640_continue() {
    
                    var state0 = '0';
    
                    for (var fld = 0; fld < noOfFields; fld++) {
                        var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                        for (var sf = 0; sf < numberOfSubFields; sf++) {
                            var subFieldValue = $('datafield').eq(fld).find('subfield').eq(sf).text();
    
                            if (ind2 == '0') {
    
                                if (subFieldValue.includes('*S')) {
                                    file.write('DIACRITICS PROBLEM!');
                                }
    
                                if (($('datafield').eq(fld).attr('tag') != null) && ($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) &&
                                    ($('datafield').eq(fld).attr('ind2') == ind2) && (($('datafield').eq(fld).find('subfield').eq(sf).text() == 'http://purl.pt/' + purl))) {
                                    state0 = '1';
                                    file.write(',OK');
                                    break;
                                }
                            }
                        }
                    }
                    if (state0 != '1') {
                        file.write(',ERROR');
                    }
                }
            }
            
            function verify85641(field, ind1, ind2) {
    
                var testField = '0';
    
                for (var fld = 0; fld < noOfFields; fld++) {
                    var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                    for (var sf = 0; sf < numberOfSubFields; sf++) {
    
                        if (($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) &&
                            ($('datafield').eq(fld).attr('ind2') == ind2)) {
                            testField = '1';
                            break;
                        }
                    }
                }
                if (testField == '0') {
                    file.write(',Doesn\'t exist');
                }
                else {
                    verify85641_continue();
                }
                
                function verify85641_continue() {
    
                    var state1 = '0';
    
                    for (var fld = 0; fld < noOfFields; fld++) {
                        var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                        for (var sf = 0; sf < numberOfSubFields; sf++) {
                            var subFieldValue = $('datafield').eq(fld).find('subfield').eq(sf).text();
    
                            if (ind2 == '1') {
    
                                if (subFieldValue.includes('*S')) {
                                    file.write('DIACRITICS PROBLEM!');
                                }
    
                                if (($('datafield').eq(fld).attr('tag') != null) && ($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) &&
                                    ($('datafield').eq(fld).attr('ind2') == ind2) && (($('datafield').eq(fld).find('subfield').eq(sf).text() == 'http://purl.pt/' + purl) ||
                                    ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'http://purl.pt/' + purl + '/service/media/cover/low'))) {
                                    state1 = '1';
                                    file.write(',OK');
                                    break;
                                }
                                else if (($('datafield').eq(fld).attr('tag') != null) && ($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) &&
                                    ($('datafield').eq(fld).attr('ind2') == ind2) && (($('datafield').eq(fld).find('subfield').eq(sf).text() == 'http://purl.pt/' + purl) ||
                                    ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'http://purl.pt/' + purl + '/service/media/cover/get'))) {
                                    state1 = '1';
                                    file.write(',ERROR');
                                    break;
                                }
                            }
                        }
                    }
                    if (state1 != '1') {
                        file.write(',ERROR');
                    }
                }
            }
            
            function verify85649(field, ind1, ind2) {
    
                var testField = '0';
    
                for (var fld = 0; fld < noOfFields; fld++) {
                    var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                    for (var sf = 0; sf < numberOfSubFields; sf++) {
    
                        if (($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) &&
                            ($('datafield').eq(fld).attr('ind2') == ind2)) {
                            testField = '1';
                            break;
                        }
                    }
                }
                if (testField == '0') {
                    file.write(',Doesn\'t exist');
                }
                else {
                    verify85649_continue();
                }
                
                function verify85649_continue() {
    
                    var state9 = '0';
                    var counter = 0;
    
                    for (var fld = 0; fld < noOfFields; fld++) {
                        var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                        for (var sf = 0; sf < numberOfSubFields; sf++) {
                            var subFieldValue = $('datafield').eq(fld).find('subfield').eq(sf).text();
    
                            if (ind2 == '9') {
    
                                if (subFieldValue.includes('*S')) {
                                    file.write('DIACRITICS PROBLEM!');
                                }
    
                                if (((($('datafield').eq(fld).attr('tag') == field) && ($('datafield').eq(fld).attr('ind1') == ind1) && ($('datafield').eq(fld).attr('ind2') == ind2))
                                    && ((subFieldValue.includes('http://purl.pt/' + purl + '/service/media/pdf')) || (subFieldValue.includes('http://purl.pt/' + purl + '/service/media/jpeg'))))
                                    &&
                                        (($('datafield').eq(fld).find('subfield').eq(sf + 1).text() == 'application/pdf') ||
                                            ($('datafield').eq(fld).find('subfield').eq(sf + 1).text() == 'image/jpeg'))) {
                                    state9 = '1';
                                    counter++;
                                    file.write(',OK');
                                    break;
                                }
                            }
                        }
                        if (counter > 0) {
                            break;
                        }
                    }
                    if (state9 != '1') {
                        file.write(',ERROR');
                    }
                }
            }
            
            function verify958_livre() {
    
                var testField = '0';
    
                for (var fld = 0; fld < noOfFields; fld++) {
    
                    if (($('datafield').eq(fld).attr('tag') == '958')) {
                        testField = '1';
                        break;
                    }
                }
                if (testField == '0') {
                    file.write(',Doesn\'t exist');
                }
                else {
                    verify958_continue();
                }
                
                function verify958_continue() {
                    var testField958 = '0';
    
                    for (var fld = 0; fld < noOfFields; fld++) {
                        var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                        for (var sf = 0; sf < numberOfSubFields; sf++) {
                            var field_958c;
                            var field_958d;
    
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'a') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'BND')) {
                                var field_958a = '$aBND';
                            }
    
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'b') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'Livre')) {
                                var field_958b = '$bLivre';
                            }
    
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'c') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'Digitalizado')) {
                                field_958c = '$cDigitalizado';
                            }
                            else if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'c') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'Nascido digital')) {
                                field_958c = '$cNascido digital';
                            }
    
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'd') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == '1')) {
                                field_958d = '$d1';
                            }
                            else {
                                field_958d = '';
                            }
    
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'e') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'http://purl.pt/' + purl + '/service/media/cover/max')) {
                                var field_958e = '$ehttp://purl.pt/' + purl + '/service/media/cover/max';
                            }
                        }
    
                        var aggregateFields = field_958a + field_958b + field_958c + field_958d + field_958e;
                        var subFieldValue = $('datafield').eq(fld).find('subfield').eq(sf).text();
    
                        if (subFieldValue.includes('*S')) {
                            file.write('RECORD WITH PROBLEMS!!!');
                        }
    
                        if ((aggregateFields == '$aBND$bLivre$cDigitalizado$d1$ehttp://purl.pt/' + purl + '/service/media/cover/max') ||
                            (aggregateFields == '$aBND$bLivre$cDigitalizado$ehttp://purl.pt/' + purl + '/service/media/cover/max') || (aggregateFields == '$aBND$bLivre$cNascido digital$ehttp://purl.pt/' + purl + '/service/media/cover/max')) {
                            if (field_958c == '$cNascido digital') {
                                file.write(',Free Access - Born-digital');
                                testField958 = '1';
                                break;
                            }
                            else {
                                file.write(',Free Access - Digitized');
                                testField958 = '1';
                                break;
                            }
                        }
                    }
                    if (testField958 == '0') {
                        file.write(',Internal Access');
                    }
                }
            }
            
            function verify958_internal() {
    
                var testField = '0';
    
                for (var fld = 0; fld < noOfFields; fld++) {
    
                    if (($('datafield').eq(fld).attr('tag') == '958')) {
                        testField = '1';
                        break;
                    }
                }
                if (testField == '0') {
                    file.write(',Doesn\'t exist');
                }
                else {
                    verify958_continue();
                }
                
                function verify958_continue() {
    
                    var testField958_internal = '0';
    
                    for (var fld = 0; fld < noOfFields; fld++) {
                        var numberOfSubFields = $('datafield').eq(fld).find('subfield').length;
    
                        for (var sf = 0; sf < numberOfSubFields; sf++) {
    
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'a') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'BND')) {
                                var field_958a_internal = 'BND';
                            }
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'b') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'Interno')) {
                                var field_958b_internal = 'Interno';
                            }
                            var field_958c_internal;
                            if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'c') && (($('datafield').eq(fld).find('subfield').eq(sf).text() == 'Digitalizado'))) {
                                field_958c_internal = 'Digitalizado';
                            }
                            else if (($('datafield').eq(fld).find('subfield').eq(sf).attr('code') == 'c') && ($('datafield').eq(fld).find('subfield').eq(sf).text() == 'Nascido digital')) {
                                field_958c_internal = 'Nascido digital';
                            }
                        }
    
                        var aggregateFields_internal = '$a' + field_958a_internal + '$b' + field_958b_internal + '$c' + field_958c_internal;
                        var subFieldValue = $('datafield').eq(fld).find('subfield').eq(sf).text();
    
                        if (subFieldValue.includes('*S')) {
                            file.write('RECORD WITH PROBLEMS!!!');
                        }
    
                        if ((aggregateFields_internal == '$aBND$bInterno$cDigitalizado') || (aggregateFields_internal == '$aBND$bInterno$cNascido digital')) {
                            if (field_958c_internal == 'Nascido digital') {
                                file.write(',Internal - Born-digital');
                                testField958_internal = '1';
                                break;
                            }
                            else {
                                file.write(',Internal - Digitized');
                                testField958_internal = '1';
                                break;
                            }
                        }
                    }
                    if (testField958_internal == '0') {
                        file.write(',Free Access');
                    }
                }
            }
            
            function verifyField997(field) {
    
                for (var fld = 0; fld < noOfFields; fld++) {
    
                    if (($('datafield').eq(fld).attr('tag') == field)) {
                        file.write(',Exists');
                        break;
                    }
                    else {
                        file.write(',Doesn\'t exist');
                        break;
                    }
                }
            }
            verify85640('856', '4', '0');
            verify85641('856', '4', '1');
            verify85649('856', '4', '9');
            verify958_livre();
            verify85640('856', '4', '0');
            verify85641('856', '4', '1');
            verify958_internal();
            verifyField997('997');
            file.write('\n');
        });
    }
}
