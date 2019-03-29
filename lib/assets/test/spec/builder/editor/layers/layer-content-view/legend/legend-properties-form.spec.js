var Backbone = require('backbone');
var LegendPropertiesFormView = require('builder/editor/layers/layer-content-views/legend/legend-properties-form');

describe('editor/layers/layer-content-views/legend/legend-properties-form', function () {
  var view;

  beforeEach(function () {
    view = new LegendPropertiesFormView({
      formModel: new Backbone.Model()
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(view, '_removeFormView');
      spyOn(view, '_initViews');
      view.render();

      expect(view.$el.html()).toContain('js-propertiesForm');
      expect(view.$el.html()).toContain('js-selector');
      expect(view._removeFormView).toHaveBeenCalled();
      expect(view._initViews).toHaveBeenCalled();
    });
  });

  describe('_updateChanges', function () {
    it('should call .commit on _formView', function () {
      view.render();
      spyOn(view._formView, 'commit');

      view._updateChanges();
      expect(view._formView.commit).toHaveBeenCalled();
    });
  });

  describe('_removeFormView', function () {
    it('should call .remove on _formView', function () {
      view.render();
      spyOn(view._formView, 'remove');

      view._removeFormView();
      expect(view._formView.remove).toHaveBeenCalled();
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
