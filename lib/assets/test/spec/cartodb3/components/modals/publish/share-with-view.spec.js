var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var ShareWithView = require('../../../../../../javascripts/cartodb3/components/modals/publish/share-with-view');

describe('components/modals/publish/share-with-view', function () {
  var view;
  var userModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    userModel = new UserModel({
      id: 1,
      username: 'pepe',
      avatar_url: 'https://example.com/avatar.jpg',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    view = new ShareWithView({
      visDefinitionModel: visDefinitionModel,
      userModel: userModel
    });

    view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      // empty because people is 0 and the user has no org
      expect(view.$('.Share-user').length).toBe(0);
      expect(view.$('.js-action').length).toBe(0);
    });

    it('should render properly when inside org', function () {
      userModel._organizationModel = new Backbone.Model({
        id: 1
      });

      spyOn(view, '_getPeople').and.returnValue(2);
      view.render();

      expect(view.$('.Share-user').length).toBe(1);
      expect(view.$el.text()).toContain('+ 2');
      expect(view.$('.js-action').length).toBe(0);
    });

    it('should render properly when inside org and has an action', function () {
      userModel._organizationModel = new Backbone.Model({
        id: 1
      });

      view.options.action = jasmine.createSpy('actionCallback');
      spyOn(view, '_getPeople').and.returnValue(0);
      view.render();

      expect(view.$('.Share-user').length).toBe(0);
      expect(view.$('.js-action').length).toBe(1);
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
