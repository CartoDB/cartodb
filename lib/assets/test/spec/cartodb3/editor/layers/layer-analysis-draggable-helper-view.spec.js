var CoreView = require('backbone/core-view');
var LayerAnalysisDraggableHelperView = require('../../../../../javascripts/cartodb3/editor/layers/layer-analysis-draggable-helper-view');

describe('editor/layers/layer-analysis-draggable-helper-view', function () {
  beforeEach(function () {
    var v = new CoreView();

    this.view = new LayerAnalysisDraggableHelperView({
      el: v.el
    });
  });

  describe('draggable', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should be initialized when view is rendered', function () {
      expect(this.view.$el.data('ui-draggable')).not.toBeUndefined();
    });
  });
});
