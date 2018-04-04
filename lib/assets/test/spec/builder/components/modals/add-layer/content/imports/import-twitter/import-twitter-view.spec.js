var _ = require('underscore');
var ImportTwitterView = require('builder/components/modals/add-layer/content/imports/import-twitter/import-twitter-view');
var getUserModelFixture = require('fixtures/builder/user-model.fixture.js');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

describe('components/modals/add-layer/content/imports/imports-twitter/import-twitter-view', function () {
  beforeEach(function () {
    this.userModel = getUserModelFixture();

    this.view = new ImportTwitterView({
      userModel: this.userModel,
      configModel: getConfigModelFixture()
    });

    this.view.render();
  });

  describe('render', function () {
    it('should be rendered properly', function () {
      expect(this.view.$('.ImportTwitterPanel-categories').length).toBe(1);
      expect(this.view.$('.ImportTwitterPanel-datePicker').length).toBe(1);
      expect(this.view.$('.ImportTwitterPanel-creditsUsage').length).toBe(1);
    });

    describe('twitter categories', function () {
      beforeEach(function () {
        this.categories = this.view.categories;
      });

      it('should render properly', function () {
        expect(this.categories.$('.TwitterCategory').length).toBe(1);
        expect(this.categories.$('.TwitterCategory label').text()).toBe(
          'components.modals.add-layer.imports.twitter.category 1');
      });

      it('should create a new category when the before one has any character', function () {
        this.categories.$('.TwitterCategory .js-terms').val('test');
        this.categories.$('.TwitterCategory .js-terms').trigger('keydown');
        expect(this.categories.$('.TwitterCategory').length).toBe(2);
      });

      it('should delete the category when it is empty and it is not the first one', function () {
        this.categories.$('.TwitterCategory .js-terms').val('test');
        this.categories.$('.TwitterCategory .js-terms').trigger('keydown');
        expect(this.categories.$('.TwitterCategory').length).toBe(2);
        this.categories.$('.TwitterCategory:eq(0) .js-terms').val('');
        this.categories.$('.TwitterCategory:eq(0) .js-terms').trigger('keydown');
        expect(this.categories.$('.TwitterCategory').length).toBe(1);
      });

      it('should render 4 categories as max', function () {
        for (var i = 0, l = 10; i < l; i++) {
          this.categories.$('.TwitterCategory:eq(' + i + ') .js-terms').val('test');
          this.categories.$('.TwitterCategory:eq(' + i + ') .js-terms').trigger('keydown');
        }
        expect(this.categories.$('.TwitterCategory').length).toBe(4);
      });

      it('should return categories as JSON format', function () {
        this.categories.$('.TwitterCategory .js-terms').val('test');
        this.categories.$('.TwitterCategory .js-terms').trigger('keydown');
        var categories = this.categories.getCategories();
        expect(categories.length).toBe(2);
        expect(categories[0].category).toBe('1');
        expect(categories[0].terms.length).toBe(1);
        expect(categories[0].terms[0]).toBe('test');
        expect(categories[1].category).toBe('2');
        expect(categories[1].terms.length).toBe(0);
      });
    });

    describe('twitter credits', function () {
      beforeEach(function () {
        this.creditsUsage = this.view.creditsUsage;

        var creditsInfoKey = _.keys(this.creditsUsage._subviews)[0];
        this.creditsInfo = this.creditsUsage._subviews[creditsInfoKey];
      });

      it('should render properly', function () {
        expect(this.creditsUsage.$('.CreditsUsage-slider').length).toBe(1);
        expect(this.creditsUsage.$('.CreditsUsage-info').length).toBe(1);
      });

      it('should set as min value 1%, not 0%', function () {
        this.creditsUsage.$('.js-slider').slider('value', 0);
        expect(this.creditsUsage.model.get('value')).toBe(1);
      });

      it('should start around 80% of quota', function () {
        var perValue = (this.creditsUsage.model.get('value') * 100) / this.userModel.get('twitter').quota;
        expect(perValue).toBe(80);
      });

      it("should let choose 'no limits' when user doesn't have hard limits", function () {
        this.creditsUsage.$('.js-slider').slider('value', 101);
        expect(this.creditsUsage.$('.js-info').text()).toContain(
          'components.modals.add-layer.imports.twitter.credits-no-limit');
      });

      it("shouldn't let choose 'no limits' when user has hard limits", function () {
        var twitterData = this.userModel.get('twitter');
        twitterData.hard_limit = true;
        this.userModel.set('twitter', twitterData);
        this.creditsUsage.render();
        this.creditsUsage.$('.js-slider').slider('value', 101);
        expect(this.creditsUsage.$('.js-info').text()).not.toContain(
          'components.modals.add-layer.imports.twitter.credits-no-limit');
      });

      it('should disable slider when user has reached his/her limits', function () {
        var twitterData = this.userModel.get('twitter');
        twitterData.monthly_use = 110;
        this.userModel.set('twitter', twitterData);
        this.view.render();
        expect(this.view.$('.js-slider').slider('option', 'disabled')).toBeTruthy();
        expect(this.view.$('.js-info').text()).toContain(
          'components.modals.add-layer.imports.twitter.credits-consumed');
      });

      it('should change credits info when credits value has changed', function () {
        expect(this.creditsInfo.model.get('value')).toBe(80);
        this.creditsUsage.model.set('value', 30);
        expect(this.creditsInfo.model.get('value')).toBe(30);
      });

      it('should update model when value has changed', function (done) {
        expect(this.creditsUsage.model.get('value')).toBe(80);
        spyOn(this.view.model, 'validate').and.callThrough();
        this.creditsUsage.model.set('value', 1);
        var that = this;
        _.defer(function () {
          var lastCall = that.view.model.validate.calls.mostRecent();
          var lastArg = lastCall.args[0].user_defined_limits.twitter_credits_limit;
          expect(lastArg).toEqual(1);
          done();
        });
      });
    });

    describe('enabled or disabled according to user\'s own credentials', function () {
      beforeEach(function () {
        this.spyOnHasOwnTwitterCredentials = spyOn(this.userModel, 'hasOwnTwitterCredentials');

        this.formIsEnabled = function () {
          var categories = !this.view.categories._disabled;
          var datepicker = !this.view.datepicker._disabled;
          var creditsUsage = !this.view.creditsUsage._disabled;

          var allInputsEnabled = categories && datepicker && creditsUsage;
          return allInputsEnabled;
        };
      });

      it('should be enabled if user has his own credentials', function () {
        this.spyOnHasOwnTwitterCredentials.and.returnValue(true);
        this.view._initViews();
        expect(this.formIsEnabled()).toBe(true);
      });

      it('should not be enabled if uses don\'t have his own', function () {
        this.spyOnHasOwnTwitterCredentials.and.returnValue(false);
        this.view._initViews();
        expect(this.formIsEnabled()).toBe(false);
      });
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
