var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureInnerView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-inner-view');

describe('editor/layers/edit-feature-content-views/edit-feature-inner-view', function () {
  beforeEach(function () {
    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"LineString","coordinates":[[0,0],[0,1]]}',
      name: '',
      description: ''
    });
    this.featureModel.isPoint = function () { return false; };
    this.featureModel.getFeatureType = function () { return 'line'; };

    this.view = new EditFeatureInnerView({
      model: this.featureModel,
      columnsCollection: new Backbone.Collection()
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // geometry, attributes
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
