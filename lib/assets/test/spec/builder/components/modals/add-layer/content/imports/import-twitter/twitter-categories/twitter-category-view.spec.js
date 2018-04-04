var Backbone = require('backbone');
var TwitterCategoryView = require('builder/components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-category-view');

/** Note: More behaviour is tested on its parent view (import-twitter.view.spec.js) */
describe('components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-category-view', function () {
  beforeEach(function () {
    this.createView = function () {
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
      expect(this.view.$('input').prop('disabled')).toBe(true);
    });
  });
});
