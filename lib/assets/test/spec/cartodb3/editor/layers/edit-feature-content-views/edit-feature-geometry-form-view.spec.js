var Backbone = require('backbone');
var EditFeatureGeometryFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureGeometryFormView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-geometry-form-view');

describe('editor/layers/edit-feature-content-views/edit-feature-geometry-form-view', function () {
  beforeEach(function () {
    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"LineString","coordinates":[[0,0],[0,1]]}',
      name: '',
      description: ''
    });
    this.featureModel._getFeatureType = function() { return 'line'; };

    this.view = new EditFeatureGeometryFormView({
      model: this.featureModel,
    });
    this.view.render();
  });

  it('should render with data from form model', function () {
    expect(this.view.$('form').length).toEqual(1);
  });

  describe('when schema changes', function () {
    beforeEach(function () {
      this.prev$form = this.view.$('form');
      this.view._formModel.trigger('changeSchema');
    });

    afterEach(function () {
      this.prev$form = null;
    });

    it('should re-render the form', function () {
      expect(this.view.$('form').length).toEqual(1);
      expect(this.view.$('form')).not.toBe(this.prev$form);
    });
  });

  describe('when form is cleaned', function () {
    beforeEach(function () {
      spyOn(Backbone.Form.prototype, 'remove').and.callThrough();
      this.view.clean();
    });

    it('should remove form when view is cleaned', function () {
      expect(Backbone.Form.prototype.remove).toHaveBeenCalled();
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
