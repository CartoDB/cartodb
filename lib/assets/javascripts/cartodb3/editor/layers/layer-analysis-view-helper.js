var LayerAnalysisViewHelper = function () {
};

/**
 * @param {Object} layerAnalysisView
 * @return {Object} a string representing the HTML code of the analysis view helper
 */
LayerAnalysisViewHelper.prototype.createHelper = function (layerAnalysisView) {
  return '<li class="' + layerAnalysisView.className + '">' + layerAnalysisView.$el.html() + '</li>';
};

module.exports = LayerAnalysisViewHelper;
