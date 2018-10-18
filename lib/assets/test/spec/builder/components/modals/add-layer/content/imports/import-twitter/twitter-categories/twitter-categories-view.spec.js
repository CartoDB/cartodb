var _ = require('underscore');
var TwitterCategoriesView = require('builder/components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-categories-view');

/** Note: More behaviour, specially 'render', is tested on its parent view (import-twitter.view.spec.js) */
describe('components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-categories-view', function () {
  beforeEach(function () {
    this.createView = function (opts) {
      var custom = opts || {};
      var defaults = {};
      var view = new TwitterCategoriesView(_.extend(defaults, custom));

      view.categoriesAreDisabled = function () {
        var allDisabled = this.collection.every(function (category) {
          return category.get('disabled');
        });
        return allDisabled;
      };

      return view;
    };
    this.view = this.createView();
  });

  it('should be enabled by default', function () {
    expect(this.view._disabled).toBe(false);
    expect(this.view.categoriesAreDisabled()).toBe(false);
  });

  it('can be created disabled or enabled', function () {
    var v = this.createView({disabled: true});
    expect(v._disabled).toBe(true);
    expect(v.categoriesAreDisabled()).toBe(true);

    v = this.createView({disabled: false});
    expect(v._disabled).toBe(false);
    expect(v.categoriesAreDisabled()).toBe(false);
  });
});
