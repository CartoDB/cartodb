var TwitterCategoriesView = require('../../../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/twitter_import/twitter_categories/twitter_categories_view');

describe('common/dialogs/create/imports/twitter_import/twitter_categories/twitter_categories_view', function() {

  beforeEach(function() {
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