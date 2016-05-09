var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base.js');
require('../../../../../../javascripts/cartodb3/components/form-components/editors/fill.js');

describe('components/form-components/editors/fill', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe'
    });

    this.view = new Backbone.Form.editors.Fill({
      key: 'names',
      schema: {
        columns: ['pepe', 'paco', 'juan']
      },
      model: this.model
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.CDB-OptionInput-item').length).toBe(2);
  });

  afterEach(function () {
    this.view.remove();
  });
});
