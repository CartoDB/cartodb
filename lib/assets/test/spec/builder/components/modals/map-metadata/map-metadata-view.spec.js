var Backbone = require('backbone');
var MetadataView = require('builder/components/modals/map-metadata/map-metadata-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var ConfigModel = require('builder/data/config-model');

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
    var parent = view.el.parentNode;
    parent && parent.removeChild(view.el);
    view.clean();
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

  it('._getMetadataName sanitizes input', function () {
    view._visMetadataModel.set('name', "><script>alert('yep');</script>");

    var name = view._getMetadataName();

    expect(name).toEqual('&gt;');
  });

  it('._getMetadataDescription sanitizes input', function () {
    view._visMetadataModel.set('description', "<img src='http://emojipedia-us.s3.amazonaws.com/cache/b8/b4/b8b4e86a110557e6b6d666c9cf6d6cc8.png' />");

    var name = view._getMetadataDescription();

    expect(name).toEqual('<img>');
  });

  it('._getMetadataTags sanitizes input', function () {
    view._visMetadataModel.set('tags', [
      "<img src='http://emojipedia-us.s3.amazonaws.com/cache/b8/b4/b8b4e86a110557e6b6d666c9cf6d6cc8.png' />",
      "><script>alert('yep');</script>"
    ]);

    var tags = view._getMetadataTags();

    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual('<img>');
    expect(tags[1]).toEqual('&gt;');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
