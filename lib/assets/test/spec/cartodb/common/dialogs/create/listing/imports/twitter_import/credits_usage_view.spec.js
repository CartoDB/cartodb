var CreditsUsageView = require('../../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/twitter_import/credits_usage_view');

describe('common/dialogs/create/imports/twitter_import/credits_usage_view', function() {

  beforeEach(function() {

    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
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

    // extracted from `import_twitter.jst.ejs`
    this.tplForView =
      '<div class="Form-rowData Form-rowData--longer CreditsUsage">' +
      '   <div class="UISlider CreditsUsage-slider js-slider"></div>' +
      '   <div class="CreditsUsage-info CDB-Text CDB-Size-small js-info"></div>' +
      '</div>';

      this.createView = function (opts) {
        var custom = opts || {};
        var defaults = {
          user: this.user,
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