var cdb = require('cartodb.js');
var LayerAnalysisViewHelper = require('../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-helper');

describe('editor/layers/analysis-view/layer-analysis-view-helper', function () {
  beforeEach(function () {
    this._layerAnalysisHelper = new LayerAnalysisViewHelper();
  });

  it('should generate a helper', function () {
    var view = new cdb.core.View({
      className: 'myClassName'
    });
    view.render = function () {
      this.$el.html('My cool <strong>HTML</strong>');
      return this;
    };

    var helper = this._layerAnalysisHelper.createHelper(view);
    expect(helper).toBe('<li class="myClassName">My cool <strong>HTML</strong></li>');
  });
});

