var Backbone = require('backbone');
var EditFeatureGeometryFormView = require('builder/editor/layers/edit-feature-content-views/edit-feature-geometry-form-view');

describe('editor/layers/edit-feature-content-views/edit-feature-geometry-form-view', function () {
  beforeEach(function () {
    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"LineString","coordinates":[[0,0],[0,1]]}',
      name: '',
      description: ''
    });
    this.featureModel.getFeatureType = function () { return 'line'; };
    this.featureModel.isPoint = function () { return false; };

    this.view = new EditFeatureGeometryFormView({
      model: this.featureModel
    });
    this.view.render();
  });

  it('should render with data from form model', function () {
    expect(this.view.$('form').length).toEqual(1);
  });

  describe('when schema changes', function () {
    beforeEach(function () {
      this.prev$form = this.view.$('form');
      this.view.model.trigger('changeSchema');
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
