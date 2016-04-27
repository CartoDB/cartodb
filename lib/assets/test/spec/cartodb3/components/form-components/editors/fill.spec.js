var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/fill.js');

describe('components/form-components/editors/fill', function () {
  beforeEach(function () {
    this.view = new Backbone.Form.editors.Fill({
      schema: {}
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-input').length).toBe(2);
  });

  afterEach(function () {
    this.view.remove();
  });
});
