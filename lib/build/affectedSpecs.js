var Promise = require('bluebird');
var StringDecoder = require('string_decoder').StringDecoder;
var separator = require('path').sep;

function getChunkParser (openingTag, closingTag) {
  var output = '';
  var stringToParse = '';
  var decoder = new StringDecoder('utf8');
  var newLine = /(\r\n|\n|\r)/;

  return function (chunk) {
    var textChunk = decoder.write(chunk);
    output += textChunk;
    if (output.indexOf(closingTag) > -1) {
      stringToParse = output.slice(
        output.indexOf(openingTag) + openingTag.length,
        output.indexOf(closingTag)
      );
      output = output.slice(output.indexOf(closingTag) + closingTag.length);
      var lines = stringToParse.split(newLine);
      stringToParse = '';
      var linesToReturn = lines.filter(function (line) {
        return line.trim().length > 0;
      });
      return linesToReturn;
    }
    return [];
  }
}

function retrieveAffectedSpecs (grunt, npmScript) {
  var promise = new Promise(function (resolve, reject) {
    var affectedSpecs = [];
    var chunkParser = getChunkParser('<affected>', '</affected>');
    npmScript = npmScript || 'affected_specs';

    var child = grunt.util.spawn({
      cmd: 'npm',
      args: ['run', npmScript]
    }, function doneFunction (error, result, code) {
      if (error) {
        reject(error);
        return;
      }

      var startLib = /^lib/;
      var relativeSpecs = affectedSpecs.map(function (spec) {
        return spec.replace(startLib, '.' + separator + 'lib');
      });
      resolve(relativeSpecs);
    });

    child.stdout.on('data', function (chunk) {
      affectedSpecs = chunkParser(chunk);
    });
  });

  return promise;
}

module.exports = retrieveAffectedSpecs;
