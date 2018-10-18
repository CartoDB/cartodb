var GuessingToggler = require('../../../../../../../javascripts/cartodb/common/dialogs/create/footer/guessing_toggler_view');
var CreateModel = require('../../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');

describe('common/dialogs/create/footer/guessing_toggler', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco',
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
      type: "map",
      option: "listing"
    }, {
      user: this.user
    });

    this.guessingModel = new cdb.core.Model({ guessing: true });
    this.view = new GuessingToggler({
      user: this.user,
      model: this.guessingModel,
      createModel: this.model
    });

    spyOn(this.model, 'bind').and.callThrough();
    this.spyOnHasOwnTwitterCredentials = spyOn(this.user, 'hasOwnTwitterCredentials');

    this.view.render();
  });

  it('should render properly', function() {
    expect(this.view.$el.text()).toContain('guess data types and content on import');
    expect(this.view.$('button').length).toBe(1);
    expect(this.view.$('button').hasClass('is-checked')).toBeTruthy();
  });

  describe('when twitter import is active', function () {
    beforeEach(function () {
      this.model.set('option', 'listing.import.twitter');
    });

    it('should not render guessing button', function() {
      expect(this.view.$el.text()).not.toContain('guess data types and content on import');
      expect(this.view.$('button').length).toBe(0);
    });
    
    it('should display how to get historical data when user has his own credentials', function () {
     this.spyOnHasOwnTwitterCredentials.and.returnValue(true);
     this.view.render();
     expect(this.view.$el.text()).toContain('access to historical data');
     expect(this.view.$el.text()).toContain('contact our team');
    });

    it('should display a deprecated warning if user does not have his own credentials', function () {
     this.spyOnHasOwnTwitterCredentials.and.returnValue(false);
     this.view.render();
     expect(this.view.$el.text()).toContain('Deprecated');
     expect(this.view.$el.text()).toContain('contact support for more information');
    });

  });

  it('should not change type and content guessing attributes when button is clicked', function() {
    // Valid "upload"
    this.model.upload.set({
      type: 'url',
      value: 'https://carto.com'
    })
    expect(this.model.upload.get('content_guessing')).toBeTruthy();
    expect(this.model.upload.get('type_guessing')).toBeTruthy();
    expect(this.view.model.get('guessing')).toBeTruthy();
    this.view.$('.js-toggle').click();
    expect(this.view.model.get('guessing')).toBeFalsy();
    expect(this.model.upload.get('content_guessing')).toBeTruthy();
    expect(this.model.upload.get('type_guessing')).toBeTruthy();
  });

  it('should not change type and content guessing attributes when upload isn\'t valid', function() {
    // Non valid "upload"
    this.model.upload.set({
      type: 'url',
      value: 'hello'
    })
    this.view.$('.js-toggle').click();
    expect(this.view.model.get('guessing')).toBeFalsy();
    expect(this.model.upload.get('content_guessing')).toBeTruthy();
    expect(this.model.upload.get('type_guessing')).toBeTruthy();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
