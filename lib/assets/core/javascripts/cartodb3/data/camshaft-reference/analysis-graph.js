'use strict';

var version = require('./version');

function AnalysisGraph(definition, wantedVersion) {
    wantedVersion = wantedVersion || 'latest';

    this.definition = definition;
    this.reference = version.getVersion(wantedVersion);
}

module.exports = AnalysisGraph;

AnalysisGraph.prototype.getNodesWithId = function() {
    return reduceById({}, this.definition, this.reference);
};

AnalysisGraph.prototype.getChildNodesNames = function() {
    return childNodes(this.definition.type, this.reference);
};

AnalysisGraph.prototype.getNodesList = function() {
    return appendAllNodes([], this.definition, this.reference);
};

AnalysisGraph.prototype.getDefinitionWith = function(nodeId, extendedWithParams) {
    return extendDefinition(this.definition, this.reference, nodeId, extendedWithParams);
};

function extendDefinition(definition, reference, nodeId, extendedWithParams) {
    if (definition.id && definition.id === nodeId) {
        Object.keys(extendedWithParams).forEach(function(extendWithParamsKey) {
            if (!definition.params.hasOwnProperty(extendWithParamsKey)) {
                definition.params[extendWithParamsKey] = {};
            }
            var obj = extendedWithParams[extendWithParamsKey];
            Object.keys(obj).forEach(function(objK) {
                definition.params[extendWithParamsKey][objK] = obj[objK];
            });
        });
    }

    childNodes(definition.type, reference)
        .filter(filterMissingOptionalNodes(definition, reference))
        .forEach(function(childNodeParamName) {
            extendDefinition(definition.params[childNodeParamName], reference, nodeId, extendedWithParams);
        });

    return definition;
}

function appendAllNodes(allNodes, definition, reference) {
    allNodes.push(definition);

    childNodes(definition.type, reference)
        .filter(filterMissingOptionalNodes(definition, reference))
        .forEach(function(childNodeParamName) {
            appendAllNodes(allNodes, definition.params[childNodeParamName], reference);
        });
    return allNodes;
}

function reduceById(nodesMap, definition, reference) {
    if (definition.id) {
        nodesMap[definition.id] = definition;
    }
    childNodes(definition.type, reference)
        .filter(filterMissingOptionalNodes(definition, reference))
        .forEach(function(childNodeParamName) {
            reduceById(nodesMap, definition.params[childNodeParamName], reference);
        });
    return nodesMap;
}

function childNodes(nodeType, reference) {
    var nodeRef = reference.analyses[nodeType];

    return Object.keys(nodeRef.params).reduce(function(childNodesNames, paramName) {
        if (nodeRef.params[paramName].type === 'node') {
            childNodesNames.push(paramName);
        }
        return childNodesNames;
    }, []);
}

function filterMissingOptionalNodes(definition, reference) {
    return function(childNodeParamName) {
        return !isOptionalParam(definition.type, childNodeParamName, reference) ||
            !!definition.params[childNodeParamName];
    };
}

function isOptionalParam(nodeType, paramName, reference) {
    var nodeRef = reference.analyses[nodeType];
    return nodeRef.params[paramName].optional;
}
