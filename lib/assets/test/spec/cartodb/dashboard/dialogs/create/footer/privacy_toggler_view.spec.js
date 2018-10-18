var PrivacyTogglerView = require('../../../../../../../javascripts/cartodb/common/dialogs/create/footer/privacy_toggler_view');
var CreateModel = require('../../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');

describe('common/dialogs/create/footer/privacy_toggler_view', function() {
  beforeEach(function() {
    window.upgrade_url = 'paco_upgrade';
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco',
      actions: {
        private_tables: true
      },
      twitter: {
        quota: 100,
        monthly_use: 0,
        block_size: 10,
        block_price: 1000,
        enabled: true,
        hard_limit: false,
        customized_config: true
      }
    });

    this.model = new CreateModel({
      type: "maps",
      option: "listing",
      listing: "import" 
    }, {
      user: this.user
    });

    this.privacyModel = new cdb.core.Model({ privacy: 'PUBLIC' });
    this.view = new PrivacyTogglerView({
      user: this.user,
      model: this.privacyModel,
      createModel: this.model
    });

    spyOn(this.model, 'bind').and.callThrough();
    this.spyOnHasOwnTwitterCredentials = spyOn(this.user, 'hasOwnTwitterCredentials');
    
    this.view.render();
  });

  it('should render properly', function() {
    expect(this.view.$('.PrivacyToggler').length).toBe(1);
    expect(this.view.$('.PrivacyToggler--PUBLIC').length).toBe(1);
    expect(this.view.$('.PrivacyToggler').hasClass('is-disabled')).toBeFalsy();
  });

  it('should change privacy when it is clicked', function() {
    expect(this.privacyModel.get('privacy')).toBe('PUBLIC');
    expect(this.view.$('.PrivacyToggler--PUBLIC').length).toBe(1);
    this.view.$('.PrivacyToggler').click();
    expect(this.privacyModel.get('privacy')).toBe('PRIVATE');
    expect(this.view.$('.PrivacyToggler--PRIVATE').length).toBe(1);
  });

  it('should point to upgrade when user can\'t change privacy', function() {
    var actions = { private_tables: false };
    this.user.set('actions', actions);
    this.view.render();
    expect(this.view.$('a.PrivacyToggler').length).toBe(1);
    expect(this.view.$('a.PrivacyToggler').attr('href')).toBe('paco_upgrade');
    expect(this.view.$('.PrivacyToggler').hasClass('is-disabled')).toBeTruthy();
  });

  it('should not point to upgrade if user can\'t change privacy and there is no upgrade url', function() {
    window.upgrade_url = '';
    var actions = { private_tables: false };
    this.user.set('actions', actions);
    this.view.render();
    expect(this.view.$('a.PrivacyToggler').length).toBe(0);
    expect(this.view.$('button.PrivacyToggler').length).toBe(1);
    expect(this.view.$('.PrivacyToggler').hasClass('is-disabled')).toBeTruthy();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when twitter import is active', function () {
    beforeEach(function () {
      this.model.set('option', 'listing.import.twitter');      
    });

    it('should be displayed if user has his own credentials', function () {
      this.spyOnHasOwnTwitterCredentials.and.returnValue(true);
      this.view.render();
      expect(this.view.$('.PrivacyToggler').length).toBe(1);
    });

    it('it should not be displayed if user does not have his own credentials', function () {
      this.spyOnHasOwnTwitterCredentials.and.returnValue(false);
      this.view.render();
      expect(this.view.$('.PrivacyToggler').length).toBe(0);
    });
  });

  afterEach(function() {
    window.upgrade_url = '';
    this.view.clean();
  });
});
