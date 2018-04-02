var Backbone = require('backbone');
var TwitterCategoryView = require('builder/components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-category-view');

/** Note: More behaviour is tested on its parent view (import-twitter.view.spec.js) */
describe('components/modals/add-layer/content/imports/import-twitter/twitter-categories/twitter-category-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      terms: [],
      category: '1',
      counter: 1014
    });
    this.view = new TwitterCategoryView({
      model: this.model
    });

    this.inputIsDisabled = function () {
      return this.view.$('input').prop('disabled');
    }.bind(this);
  });

  it('should be enabled by default', function () {
    this.view.render();
    expect(this.inputIsDisabled()).toBe(false);
  });

  it('can be explicitly disabled', function () {
    this.model.set('disabled', true);
    this.view.render();
    expect(this.inputIsDisabled()).toBe(true);

    this.model.set('disabled', false);
    this.view.render();
    expect(this.inputIsDisabled()).toBe(false);
  });
});
