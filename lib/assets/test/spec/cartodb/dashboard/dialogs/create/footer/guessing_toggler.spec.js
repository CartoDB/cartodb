var GuessingToggler = require('../../../../../../../javascripts/cartodb/common/dialogs/create/footer/guessing_toggler_view');
var CreateModel = require('../../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');

describe('dashboard/dialogs/create/footer/guessing_toggler', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
    });

    this.model = new CreateModel({
      type: "map",
      option: "listing"
    }, {
      user: this.user
    });

    this.view = new GuessingToggler({
      createModel: this.model
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render properly', function() {
    expect(this.view.$el.text()).toContain('guess data types and content on import');
    expect(this.view.$('button').length).toBe(1);
    expect(this.view.$('button').hasClass('is-checked')).toBeTruthy();
  });

  it('shouldn\'t render guessing button when twitter import is selected', function() {
    this.model.set('option', 'listing.import.twitter');
    expect(this.view.$el.text()).not.toContain('guess data types and content on import');
    expect(this.view.$el.text()).toContain('access to historical data');
    expect(this.view.$('button').length).toBe(0);
  });

  it('should change type and content guessing attributes when button is clicked', function() {
    // Valid "upload"
    this.model.upload.set({
      type: 'url',
      value: 'http://cartodb.com'
    })
    expect(this.model.upload.get('content_guessing')).toBeTruthy();
    expect(this.model.upload.get('type_guessing')).toBeTruthy();
    expect(this.view.model.get('guessing')).toBeTruthy();
    this.view.$('.js-toggle').click();
    expect(this.view.model.get('guessing')).toBeFalsy();
    expect(this.model.upload.get('content_guessing')).toBeFalsy();
    expect(this.model.upload.get('type_guessing')).toBeFalsy();
  });

  it('should change type and content guessing attributes when upload isn\'t valid', function() {
    // Non valid "upload"
    this.model.upload.set({
      type: 'url',
      value: 'hello'
    })
    this.view.$('.js-toggle').click();
    expect(this.view.model.get('guessing')).toBeFalsy();
    expect(this.model.upload.get('content_guessing')).toBeFalsy();
    expect(this.model.upload.get('type_guessing')).toBeFalsy();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
