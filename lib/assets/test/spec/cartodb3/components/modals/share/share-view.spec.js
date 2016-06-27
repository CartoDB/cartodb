var _ = require('underscore');
var Backbone = require('backbone');
var ShareView = require('../../../../../../javascripts/cartodb3/components/modals/share/share-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');

describe('components/modals/share/share-view', function () {
  var view;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00'
    }, {
      configModel: configModel
    });

    var userModel = new Backbone.Model({
      avatar_url: 'example.com/avatars/avatar_mountains_red.png'
    });

    view = new ShareView({
      modalModel: new Backbone.Model(),
      configModel: configModel,
      visDefinitionModel: visDefinitionModel,
      userModel: userModel
    });

    spyOn(view, '_onUpdate');
    spyOn(view, '_onContinue');

    view.render();
    view.$el.appendTo(document.body);
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    expect(view._subviews).toBeDefined();
    expect(_.keys(view._subviews).length).toBe(7);
    expect(view.$('h2').text()).toBe('Foo Map');
    expect(view.$('.Share-details i').first().text()).toBe('PUBLIC');
    expect(view.$('.Card').length).toBe(4);
    expect(view.$('.Share-copy').length).toBe(4); // Copy buttons
    expect(view.$('.Modal-actions-button').length).toBe(2);
  });

  it('should bind actions properly', function () {
    view.$('.Modal-actions-button button').eq(0).trigger('click');
    expect(view._onContinue).toHaveBeenCalled();

    view.$('.Modal-actions-button button').eq(1).trigger('click');
    expect(view._onUpdate).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
