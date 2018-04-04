var $ = require('jquery');
var _ = require('underscore');
var CreditsUsageView = require('builder/components/modals/add-layer/content/imports/import-twitter/credits-usage-view');
var getUserModelFixture = require('fixtures/builder/user-model.fixture.js');

/** Note: More behaviour is tested on its parent view (import-twitter.view.spec.js) */
describe('components/modals/add-layer/content/imports/imports-twitter/credits-usage-view', function () {
  beforeEach(function () {
    this.userModel = getUserModelFixture();

    // extracted from `import-twitter.tpl`
    this.tplForView =
      '<div class="Form-rowData Form-rowData--longer CreditsUsage">' +
      '   <div class="UISlider CreditsUsage-slider js-slider"></div>' +
      '   <div class="CreditsUsage-info CDB-Text CDB-Size-medium js-info"></div>' +
      '</div>';

    this.createView = function (opts) {
      var custom = opts || {};
      var defaults = {
        userModel: this.userModel,
        el: $(this.tplForView)
      };
      return new CreditsUsageView(_.extend(defaults, custom));
    };
    this.view = this.createView();
  });

  it('should be enabled by default', function () {
    expect(this.view._disabled).toBe(false);
  });

  it('can be created disabled or enabled', function () {
    var v = this.createView({disabled: true});
    expect(v._disabled).toBe(true);

    v = this.createView({disabled: false});
    expect(v._disabled).toBe(false);
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.js-slider').length).toBe(1);
      expect(this.view.$('.js-info').length).toBe(1);
    });

    it('can be rendered with a disabled or enabled slider', function () {
      expect(this.view._disabled).toBe(false);
      expect(this.view.$('.js-slider').slider('option', 'disabled')).toBe(false);

      this.view._disabled = true;
      this.view.render();
      expect(this.view.$('.js-slider').slider('option', 'disabled')).toBe(true);
    });
  });
});
