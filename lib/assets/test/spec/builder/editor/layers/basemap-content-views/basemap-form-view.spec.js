var BasemapsCollection = require('builder/editor/layers/basemap-content-views/basemaps-collection');
var BasemapFormView = require('builder/editor/layers/basemap-content-views/basemap-form-view');
var Backbone = require('backbone');

describe('editor/layers/basemap-content-views/basemap-form-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      default: false,
      color: '#35AAE5',
      image: '',
      maxZoom: 32,
      className: 'plain',
      category: 'Color',
      type: 'Plain',
      selected: true,
      val: 'plain',
      label: 'plain',
      template: function () {
        return 'plain';
      }
    });

    this.view = new BasemapFormView({
      model: this.model,
      basemapsCollection: new BasemapsCollection(),
      layerDefinitionsCollection: {}
    });
    this.view.render();
  });

  it('should render with data from form model', function () {
    expect(this.view.$('form').length).toEqual(1);
    expect(this.view.$el.html()).toContain('Form-InputFill');
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
