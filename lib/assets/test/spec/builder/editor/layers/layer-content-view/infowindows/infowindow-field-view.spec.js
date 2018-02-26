var $ = require('jquery');
var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var InfowindowFieldView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-field-view');
var InfowindowDefinitionModel = require('builder/data/infowindow-definition-model');

describe('editor/layers/layer-content-view/infowindows/infowindow-field-view', function () {
  var view, model;

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    model = new InfowindowDefinitionModel({}, {
      configModel: this.configModel
    });

    view = new InfowindowFieldView({
      layerInfowindowModel: model,
      field: { name: 'name1', title: true },
      position: 0
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      view.render();
    });

    it('should render correctly', function () {
      expect(_.size(view._subviews)).toBe(1); // [tooltip]
    });
  });

  it('should toggle check', function () {
    view.render();
    model.addField('name1');
    expect(!!$(view.$el.find('.js-checkbox')).attr('checked')).toEqual(true);
    model.removeField('name1');
    expect(!!$(view.$el.find('.js-checkbox')).attr('checked')).toEqual(false);
  });

  it('should toggle field on click', function () {
    view.render();
    model.addField('name1');
    expect(model.containsField('name1')).toEqual(true);
    view.toggle();
    expect(model.containsField('name1')).toEqual(false);
  });

  it('should set empty alternative name after uncheck', function () {
    view.render();
    model.addField('name1');
    model.setAlternativeName('name1', 'nombre');
    expect(model.getAlternativeName('name1')).toEqual('nombre');
    view.toggle();
    expect(model.getAlternativeName('name1')).toEqual('');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
