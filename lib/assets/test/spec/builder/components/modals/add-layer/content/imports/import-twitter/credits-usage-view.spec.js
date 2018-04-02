var $ = require('jquery');
var UserModel = require('builder/data/user-model');
var CreditsUsageView = require('builder/components/modals/add-layer/content/imports/import-twitter/credits-usage-view');

/** Note: More behaviour is tested on its parent view (import-twitter.view.spec.js) */
describe('components/modals/add-layer/content/imports/imports-twitter/credits-usage-view', function () {
  beforeEach(function () {
    var configModel = jasmine.createSpyObj('configModel', ['get']);

    this.userModel = new UserModel({ username: 'a-user' }, { configModel: configModel });
    var twitter = {
      quota: 100,
      monthly_use: 0,
      block_size: 10,
      block_price: 1000,
      enabled: true,
      hard_limit: false,
      customized_config: true
    };
    this.userModel.set('twitter', twitter);

    // extract from `import-twitter.tpl`
    this.tplForView =
      '<div class="Form-rowData Form-rowData--longer CreditsUsage">' +
      '   <div class="UISlider CreditsUsage-slider js-slider"></div>' +
      '   <div class="CreditsUsage-info CDB-Text CDB-Size-medium js-info"></div>' +
      '</div>';
  });

  it('should be enabled by default', function () {
    var view = new CreditsUsageView({
      userModel: this.userModel,
      el: $(this.tplForView)
    });
    view.render();

    expect(view.isDisabled).toBe(false);
    expect(view.$('.js-slider').slider('option', 'disabled')).toBe(false);
  });

  it('can be rendered disabled', function () {
    var view = new CreditsUsageView({
      userModel: this.userModel,
      el: $(this.tplForView),
      disabled: true
    });
    view.render();

    expect(view.isDisabled).toBe(true);
    expect(view.$('.js-slider').slider('option', 'disabled')).toBe(true);
  });
});
