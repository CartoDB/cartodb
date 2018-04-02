var TwitterCategoriesView = require('builder/components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-categories-view');

/** Note: More behaviour is tested on its parent view (import-twitter.view.spec.js) */
describe('components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-categories-view', function () {
  beforeEach(function () {
    this.categoriesAreDisabled = function () {
      var allDisabled = this.view.collection.every(function (category) {
        return category.get('disabled');
      });
      return allDisabled;
    }.bind(this);
  });

  it('should be enabled by default', function () {
    this.view = new TwitterCategoriesView();
    expect(this.categoriesAreDisabled()).toBe(false);
  });

  it('should be enabled by default', function () {
    this.view = new TwitterCategoriesView({disabled: true});
    expect(this.categoriesAreDisabled()).toBe(true);
  });
});
