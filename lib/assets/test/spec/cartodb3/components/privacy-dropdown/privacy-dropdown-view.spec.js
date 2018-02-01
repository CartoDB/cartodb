var PrivacyDropdown = require('../../../../../javascripts/cartodb3/components/privacy-dropdown/privacy-dropdown-view');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var PrivacyCollection = require('../../../../../javascripts/cartodb3/components/modals/publish/privacy-collection');
var VisDefinitionModel = require('../../../../../javascripts/cartodb3/data/vis-definition-model');
var TipsyTooltipView = require('../../../../../javascripts/cartodb3/components/tipsy-tooltip-view');

describe('components/privacy-dropdown/privacy-dropdown-view', function () {
  var view;
  var configModel;
  var collection;
  var userModel;
  var visDefinitionModel;

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

    spyOn(PrivacyDropdown.prototype, '_savePrivacy');
    spyOn(PrivacyDropdown.prototype, '_onToggleDialogClicked').and.callThrough();
    spyOn(PrivacyDropdown.prototype, '_setPrivacy').and.callThrough();
    spyOn(TipsyTooltipView.prototype, 'hideTipsy');

    view = new PrivacyDropdown({
      privacyCollection: collection,
      visDefinitionModel: visDefinitionModel,
      userModel: userModel,
      configModel: configModel,
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

  describe('if is not the owner', function () {
    var view;

    beforeEach(function () {
      view = new PrivacyDropdown({
        privacyCollection: collection,
        visDefinitionModel: visDefinitionModel,
        userModel: userModel,
        configModel: configModel,
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
    expect(PrivacyDropdown.prototype._savePrivacy).toHaveBeenCalled();

    expect(view.model.get('privacy')).toBe('link');

    view.model.set({state: 'loading'}); // to simulate request
    expect(view.$('.CDB-LoaderIcon-spinner').length).toBe(1);

    view.model.set({state: 'show'}); // to simulate success
    expect(view.$('.Privacy-dropdownTrigger').text()).toContain('link');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
