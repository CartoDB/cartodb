'use strict';

var version = require('../package.json').version;
var nodes = require('../lib/node');

var useOptions = !!process.env.OPTIONS;

var analyses = Object.keys(nodes).reduce(function(analyses, modelName) {
    analyses[nodes[modelName].TYPE] = {
        params: nodes[modelName].PARAMS
    };

    if (useOptions) {
        analyses[nodes[modelName].TYPE].options = nodes[modelName].OPTIONS
    }

    return analyses;
}, {});

var reference = {
    version: version,
    analyses: analyses
};

module.exports = reference;
