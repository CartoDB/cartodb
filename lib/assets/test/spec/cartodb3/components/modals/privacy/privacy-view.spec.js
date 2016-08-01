var _ = require('underscore');
var Backbone = require('backbone');
var PrivacyView = require('../../../../../../javascripts/cartodb3/components/modals/privacy/privacy-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var PrivacyCollection = require('../../../../../../javascripts/cartodb3/components/modals/privacy/privacy-collection');

describe('components/modals/privacy/privacy-view', function () {
  var view;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    var userModel = new Backbone.Model({
      actions: {
        private_maps: true,
        private_tables: true
      }
    });

    var collection = new PrivacyCollection([{
      privacy: 'PUBLIC',
      title: 'Public',
      desc: 'Lorem ipsum',
      cssClass: 'is-green',
      selected: true
    }, {
      privacy: 'LINK',
      title: 'Link',
      desc: 'Yabadababa',
      cssClass: 'is-orange'
    }, {
      privacy: 'PASSWORD',
      title: 'Password',
      desc: 'Wadus'
    }, {
      privacy: 'PRIVATE',
      title: 'Private',
      desc: 'Funínculo',
      cssClass: 'is-red'
    }]);

    spyOn(PrivacyView.prototype, '_onCancel');
    spyOn(PrivacyView.prototype, '_onSave');

    view = new PrivacyView({
      privacyCollection: collection,
      modalModel: new Backbone.Model(),
      configModel: configModel,
      visDefinitionModel: visDefinitionModel,
      userModel: userModel
    });

    view.render();
    view.$el.appendTo(document.body);
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    expect(view._subviews).toBeDefined();
    expect(_.keys(view._subviews).length).toBe(4);
    expect(view.$('input[type=password]').length).toBe(1);
    expect(view.$('.Tag').length).toBe(3);
    expect(view.$('.Tag').eq(0).text()).toBe('PUBLIC');
    expect(view.$('.Tag').eq(1).text()).toBe('LINK');
    expect(view.$('.Tag').eq(2).text()).toBe('PRIVATE');
    expect(view.$('.Modal-actions-button').length).toBe(2);
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

  it('should bind properly', function () {
    view.$('.Modal-actions-button button').eq(0).trigger('click');
    expect(PrivacyView.prototype._onCancel).toHaveBeenCalled();

    view.$('.Modal-actions-button button').eq(1).trigger('click');
    expect(PrivacyView.prototype._onSave).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
