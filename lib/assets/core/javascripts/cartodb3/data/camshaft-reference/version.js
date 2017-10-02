'use strict';

var versions = require('./versions');
var availableVersions = Object.keys(versions).filter(function(version) {
    return version !== 'latest';
});

module.exports.getVersion = function (version) {
    if (!versions.hasOwnProperty(version)) {
        throw new Error(
                'Invalid camshaft-reference version: "' + version + '". ' +
                'Valid versions are: ' + availableVersions.join(', ') + '.'
        );
    }

    return versions[version];
};

module.exports.versions = availableVersions;
