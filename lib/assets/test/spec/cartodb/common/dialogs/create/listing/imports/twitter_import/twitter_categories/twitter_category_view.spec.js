var TwitterCategoryView = require('../../../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/twitter_import/twitter_categories/twitter_category_view');

describe('common/dialogs/create/imports/twitter_import/twitter_categories/twitter_category_view', function() {

  beforeEach(function() {
    this.createView = function (opts) {
      var m = new Backbone.Model({
        terms: [],
        category: '1',
        counter: 1014
      });
      return new TwitterCategoryView({model: m});
    };
    this.view = this.createView();
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('input').length).toBe(1);
    });

    it('can be rendered disabled or enabled', function () {
      this.view.model.set('disabled', false);
      this.view.render();
      expect(this.view.$('input').prop('disabled')).toBe(false);

      this.view.model.set('disabled', true);
      this.view.render();
      expect(this.view.$('input').prop('disabled')).toBe(false);
    });
  });
});