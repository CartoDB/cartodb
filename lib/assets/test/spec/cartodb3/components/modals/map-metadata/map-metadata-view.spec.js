var Backbone = require('backbone');
var MetadataView = require('../../../../../../javascripts/cartodb3/components/modals/map-metadata/map-metadata-view');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('components/modals/map-metadata/map-metadata-view', function () {
  var view;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'LINK',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      tags: ['foo', 'bar'],
      permission: {}
    }, {
      configModel: configModel
    });

    view = new MetadataView({
      modalModel: new Backbone.Model(),
      visDefinitionModel: visDefinitionModel
    });

    view.render();
    view.$el.appendTo(document.body);
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    expect(view.$('.Metadata-form').length).toBe(1);
    expect(view.$('.js-name-field input').length).toBe(1);
    expect(view.$('.js-name-field input').val()).toBe('Foo Map');
    expect(view.$('.js-description-field textarea').length).toBe(1);
    expect(view.$('.js-tags-field .Form-tagsList').length).toBe(1);
    expect(view.$('.tagit-label').length).toBe(2);
    expect(view.$('.tagit-label').eq(0).text()).toBe('foo');
    expect(view.$('.tagit-label').eq(1).text()).toBe('bar');
  });

  it('should render error', function () {
    view._stateModel.set({status: 'error'});
    expect(view.$('.u-errorTextColor').length).toBe(1);
    expect(view.$('input[type=password]').length).toBe(0);
    expect(view.$('.Tag').length).toBe(0);
    expect(view.$('.Modal-actions-button').length).toBe(1);
  });

  it('should render loading', function () {
    view._stateModel.set({status: 'loading'});
    expect(view.$('.Modal-actions-button').length).toBe(0);
    expect(view.$('input[type=password]').length).toBe(0);
    expect(view.$('.js-loader').length).toBe(1);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
