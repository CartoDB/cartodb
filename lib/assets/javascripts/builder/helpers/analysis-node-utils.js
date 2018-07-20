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

  const source = nodeModel.getPrimarySource && nodeModel.getPrimarySource();

  if (source) {
    return someNode(source, predicate);
  }

  return false;
}

function hasTradeArea (node) {
  return node.get('type') === 'trade-area';
}

module.exports = {
  nodeHasTradeArea: node => someNode(node, hasTradeArea),

  // These are defined outside because they're recursive
  getSourceNode,
  someNode
};
