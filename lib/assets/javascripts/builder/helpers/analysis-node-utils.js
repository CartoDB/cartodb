// Get the source node from an analysis node
function getSourceNode (nodeModel) {
  var source;
  if (nodeModel.get('type') === 'source') {
    source = nodeModel;
  } else {
    var primarySource = nodeModel.getPrimarySource && nodeModel.getPrimarySource();
    if (primarySource && primarySource.get('type') === 'source') {
      source = primarySource;
    } else {
      source = getSourceNode(primarySource);
    }
  }

  return source;
}

// Evaluates predicate for the analysis chain from nodeModel
function someNode (nodeModel, predicate) {
  if (predicate(nodeModel)) {
    return nodeModel;
  }

  if (nodeModel.get('type') !== 'source') {
    const source = nodeModel.getPrimarySource && nodeModel.getPrimarySource();

    if (source) {
      return someNode(source, predicate);
    }
  }

  return false;
}

function hasAnalysisType (type) {
  return function (node) {
    return node.get('type') === type;
  };
}

const hasTradeArea = hasAnalysisType('trade-area');
const hasSQLFunction = hasAnalysisType('deprecated-sql-function');

module.exports = {
  nodeHasTradeArea: node => someNode(node, hasTradeArea),
  nodeHasSQLFunction: node => someNode(node, hasSQLFunction),

  // These are defined outside because they're recursive
  getSourceNode,
  someNode
};
