var Backbone = require('backbone');
var PrivacyDropdown = require('builder/components/privacy-dropdown/privacy-dropdown-view');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var PrivacyCollection = require('builder/components/modals/publish/privacy-collection');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

describe('components/privacy-dropdown/privacy-dropdown-view', function () {
  var view;
  var configModel;
  var collection;
  var userModel;
  var visDefinitionModel;
  var mapcapsCollection;
  var savePrivacySpy;

  beforeEach(function () {
    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    collection = new PrivacyCollection([{
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

    userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    mapcapsCollection = new Backbone.Collection();

    spyOn(PrivacyDropdown.prototype, '_onToggleDialogClicked').and.callThrough();
    spyOn(PrivacyDropdown.prototype, '_setPrivacy').and.callThrough();
    spyOn(TipsyTooltipView.prototype, 'hideTipsy');
    savePrivacySpy = spyOn(PrivacyDropdown.prototype, '_savePrivacy').and.callThrough();

    view = new PrivacyDropdown({
      privacyCollection: collection,
      visDefinitionModel: visDefinitionModel,
      userModel: userModel,
      configModel: configModel,
      mapcapsCollection: mapcapsCollection,
      isOwner: true
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
    expect(view.$('.Privacy-dropdownTrigger').length).toBe(1);
    expect(view.$('.Privacy-dropdownTrigger').text()).toContain('PUBLIC');
    expect(view._collectionPane.at(0).get('selected')).toBe(true);
    expect(view.$('.js-content').children().length).toBe(0); // empty initially
  });

  describe('if is a Individual user and map privacy is private', function () {
    var view;

    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    afterEach(function () {
      var parent = view.el.parentNode;
      parent && parent.removeChild(view.el);
      view.clean();
    });

    it('should render properly', function () {
      userModel = new UserModel({
        username: 'pepe',
        account_type: 'Individual',
        public_map_quota: 10,
        public_privacy_map_count: 3,
        password_privacy_map_count: 2,
        link_privacy_map_count: 4,
        actions: {
          private_tables: true
        }
      }, {
        configModel: configModel
      });

      view = createPrivacyDropdown(userModel);

      view.render();
      view.$el.appendTo(document.body);

      expect(view.$('.Privacy-dropdownTrigger').length).toBe(1);
      expect(view.$('.Privacy-dropdownTrigger').text()).toContain('PRIVATE');
      expect(view.$('.Privacy-dropdownTrigger').hasClass('is-disabled')).toBe(false);
      expect(view._collectionPane.at(0).get('selected')).toBe(true);
      expect(view.$('.js-content').children().length).toBe(0); // empty initially
    });

    it('should render properly and be active if there are no other public maps', function () {
      userModel = new UserModel({
        username: 'pepe',
        account_type: 'Individual',
        public_map_quota: 10,
        public_privacy_map_count: 0,
        password_privacy_map_count: 0,
        link_privacy_map_count: 0,
        actions: {
          private_tables: true
        }
      }, {
        configModel: configModel
      });

      view = createPrivacyDropdown(userModel);

      view.render();
      view.$el.appendTo(document.body);

      expect(view.$('.Privacy-dropdownTrigger').length).toBe(1);
      expect(view.$('.Privacy-dropdownTrigger').text()).toContain('PRIVATE');
      expect(view.$('.Privacy-dropdownTrigger').hasClass('is-disabled')).toBe(false);
    });

    it('should render properly and be disabled if user is out of public maps quota', function () {
      userModel = new UserModel({
        username: 'pepe',
        account_type: 'Individual',
        public_map_quota: 10,
        public_privacy_map_count: 3,
        password_privacy_map_count: 2,
        link_privacy_map_count: 5,
        actions: {
          private_tables: true
        }
      }, {
        configModel: configModel
      });

      view = createPrivacyDropdown(userModel);

      view.render();
      view.$el.appendTo(document.body);

      expect(view.$('.Privacy-dropdownTrigger').length).toBe(1);
      expect(view.$('.Privacy-dropdownTrigger').text()).toContain('PRIVATE');
      expect(view.$('.Privacy-dropdownTrigger').hasClass('is-disabled')).toBe(true);
    });

    function createPrivacyDropdown (customUserModel) {
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
        account_type: 'Individual',
        public_map_quota: 10,
        public_privacy_map_count: 3,
        password_privacy_map_count: 2,
        link_privacy_map_count: 5,
        actions: {
          private_tables: true
        }
      }, {
        configModel: configModel
      });

      view = new PrivacyDropdown({
        privacyCollection: collection,
        visDefinitionModel: visDefinitionModel,
        userModel: customUserModel || userModel,
        configModel: configModel,
        mapcapsCollection: mapcapsCollection,
        isOwner: true
      });

      return view;
    }
  });

  describe('if is not the owner', function () {
    var view;

    beforeEach(function () {
      view = new PrivacyDropdown({
        privacyCollection: collection,
        visDefinitionModel: visDefinitionModel,
        userModel: userModel,
        configModel: configModel,
        mapcapsCollection: mapcapsCollection,
        isOwner: false,
        ownerName: 'rick'
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
      expect(view.$('.Privacy-dropdownTrigger').hasClass('is-disabled')).toBe(true);
    });

    it('should show tipsy', function () {
      view.$('.js-tooltip').hover();
      expect(view.$('.js-tooltip').data('tipsy')).not.toBeUndefined();
      expect(view.$('.js-tooltip').data().tipsy.options.title()).toBe('dataset.privacy.info');
    });
  });

  it('should bind events properly', function () {
    view.$('.js-toggle').click();
    expect(PrivacyDropdown.prototype._onToggleDialogClicked).toHaveBeenCalled();
    expect(view._collectionPane.at(1).get('selected')).toBe(true);
    expect(view.$('.js-content').children().length).toBe(1); // custom list
    expect(view.$('.js-content .js-listItem').length).toBe(4);
  });

  it('should show password dialog', function () {
    view.$('.js-toggle').click();
    view.$('.js-content .js-listItem[data-val=password]').trigger('click');
    expect(view._collectionPane.at(2).get('selected')).toBe(true);
    expect(view.$('.js-content .js-input').length).toBe(1); // password field
  });

  it('should show and hide tipsy', function () {
    view.$('.js-tooltip').hover();
    expect(view.$('.js-tooltip').data('tipsy')).not.toBeUndefined();
    expect(view.$('.js-tooltip').data().tipsy.options.title()).toBe('change-privacy');

    view.$('.js-tooltip').click();
    expect(TipsyTooltipView.prototype.hideTipsy).toHaveBeenCalled();
  });

  it('should change privacy', function () {
    view.$('.js-toggle').click();
    view.$('.js-content .js-listItem[data-val=link]').trigger('click');

    expect(PrivacyDropdown.prototype._setPrivacy).toHaveBeenCalled();
    expect(savePrivacySpy).toHaveBeenCalled();

    expect(view.model.get('privacy')).toBe('LINK');

    view.model.set({state: 'loading'}); // to simulate request
    expect(view.$('.CDB-LoaderIcon-spinner').length).toBe(1);

    view.model.set({state: 'show'}); // to simulate success
    expect(view.$('.Privacy-dropdownTrigger').text()).toContain('LINK');
  });

  describe('_setPrivacy', function () {
    it('should save privacy when privacy warning modal is not shown', function () {
      spyOn(view, '_shouldShowPrivacyWarning').and.returnValue(false);
      spyOn(view, '_checkPrivacyChange');
      savePrivacySpy.and.callThrough();

      view._setPrivacy('link');

      expect(savePrivacySpy).toHaveBeenCalled();
      expect(view._checkPrivacyChange).not.toHaveBeenCalled();
      expect(view.model.get('privacy')).toBe('LINK');
    });

    it('should save privacy when privacy warning modal is shown and user confirms', function () {
      spyOn(view, '_shouldShowPrivacyWarning').and.returnValue(true);
      spyOn(view, '_checkPrivacyChange').and.callFake(
        function (_newPrivacyStatus, success) {
          success();
        }
      );
      savePrivacySpy.and.callThrough();

      view._setPrivacy('link');

      expect(view._checkPrivacyChange).toHaveBeenCalled();
      expect(view._savePrivacy).toHaveBeenCalled();
      expect(view.model.get('privacy')).toBe('LINK');
    });

    it('should not save privacy when privacy warning modal is shown and user dismisses', function () {
      spyOn(view, '_shouldShowPrivacyWarning').and.returnValue(true);
      spyOn(view, '_checkPrivacyChange').and.callFake(
        function (_newPrivacyStatus, _success, dismiss) {
          dismiss();
        }
      );
      savePrivacySpy.and.callThrough();

      view._setPrivacy('link');

      expect(view._savePrivacy).not.toHaveBeenCalled();
      expect(view._checkPrivacyChange).toHaveBeenCalled();
      expect(view.model.get('privacy')).toBe('PUBLIC');
    });
  });

  describe('_checkPrivacyChange', function () {
    it('should open PrivacyWarningView', function (done) {
      view._checkPrivacyChange('PUBLIC');

      var dialogView = document.querySelector('.Dialog');
      expect(dialogView.innerText).toContain('components.modals.privacy-warning.title');

      view._modals.destroy();

      // Wait for the modal to close
      setTimeout(function () { done(); }, 250);
    });
  });

  describe('_discardPrivacyChange', function () {
    it('should go back to previous state', function (done) {
      var previousPrivacyState = view.model.get('privacy');
      var currentPrivacyState;

      view.model.on('change:privacy', function (m) {
        currentPrivacyState = view.model.get('privacy');

        view._discardPrivacyChange();

        expect(view.model.get('privacy')).toBe(previousPrivacyState);
        expect(currentPrivacyState).toBe('PRIVATE');
        done();
      });

      view.model.set('privacy', 'PRIVATE');
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
