var Backbone = require('backbone');
var ModalsService = require('../../../../javascripts/cartodb3/components/modals/modals-service-model');
var Header = require('../../../../javascripts/cartodb3/editor/editor-header.js');
var EditorModel = require('../../../../javascripts/cartodb3/data/editor-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var PrivacyCollection = require('../../../../javascripts/cartodb3/components/modals/publish/privacy-collection');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('editor/editor-header', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, { configModel: configModel });

    var privacyCollection = new PrivacyCollection([{
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

    var visDefinitionModel = new VisDefinitionModel({
      name: 'My super fun vis',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    var editorModel = new EditorModel();

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);

    var modals = new ModalsService();

    var onClickPrivacy = jasmine.createSpy('onClickPrivacy');
    var onRemoveMap = jasmine.createSpy('onRemoveMap');

    spyOn(Header.prototype, '_duplicateMap');

    this.view = new Header({
      editorModel: editorModel,
      mapcapsCollection: mapcapsCollection,
      modals: modals,
      visDefinitionModel: visDefinitionModel,
      privacyCollection: privacyCollection,
      onClickPrivacy: onClickPrivacy,
      onRemoveMap: onRemoveMap,
      configModel: configModel,
      userModel: userModel
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-toggle-menu').length).toBe(1);
    expect(this.view.$('.js-privacy').length).toBe(1);
    expect(this.view.$('.Editor-HeaderInfo-title').html()).toContain('My super fun vis');
    expect(this.view.$('.js-privacy').html()).toContain('PUBLIC');
  });

  it('should call duplicate when duplicate option is clicked', function () {
    this.view.$('.js-toggle-menu').click();
    this.view._contextMenuFactory.getContextMenu().$('[data-val="duplicate-map"]').click();
    expect(Header.prototype._duplicateMap).toHaveBeenCalled();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
