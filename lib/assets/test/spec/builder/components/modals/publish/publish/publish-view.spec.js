var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var PrivacyView = require('builder/components/modals/publish/publish/publish-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var UserModel = require('builder/data/user-model');

describe('components/modals/publish/publish/publish-view', function () {
  var view;
  var mapcapsCollection;
  var visDefinitionModel;
  var userModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PRIVATE',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    mapcapsCollection = new Backbone.Collection([]);
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    view = privacyView(visDefinitionModel, userModel, mapcapsCollection);
    expect(view.$('.Card').length).toBe(2);
    expect(view.$('input').length).toBe(0);
  });

  it('should render properly when published and private', function () {
    mapcapsCollection.reset([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);
    view = privacyView(visDefinitionModel, userModel, mapcapsCollection);
    expect(view.$('.Card').length).toBe(2);
    expect(view.$('.Card.is-disabled').length).toBe(2);
    expect(view.$('input').length).toBe(0); // it's private
  });

  it('should render properly when published and public', function () {
    mapcapsCollection.reset([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);
    visDefinitionModel.set({privacy: 'PUBLIC'});
    visDefinitionModel.trigger('sync');
    view = privacyView(visDefinitionModel, userModel, mapcapsCollection);

    expect(view.$('.Card').length).toBe(2);
    expect(view.$('.Card.is-disabled').length).toBe(0);
    expect(view.$('input').length).toBe(2);
  });

  it('should render properly when kuviz', function () {
    visDefinitionModel.set({
      privacy: 'PUBLIC',
      type: 'kuviz'
    });
    visDefinitionModel.trigger('sync');
    view = privacyView(visDefinitionModel, userModel);

    expect(view.$('.Card').length).toBe(2);
    expect(view.$('.Card.is-disabled').length).toBe(0);
    expect(view.$('input').length).toBe(2);
  });

  it('should not have any leaks', function () {
    view = privacyView(visDefinitionModel, userModel, mapcapsCollection);
    expect(view).toHaveNoLeaks();
  });
});

var privacyView = function (visDefinitionModel, userModel, mapcapsCollection) {
  var view = new PrivacyView({
    mapcapsCollection,
    visDefinitionModel,
    userModel
  });
  view.render();
  return view;
};
