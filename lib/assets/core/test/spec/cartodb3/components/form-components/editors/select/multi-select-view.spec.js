var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../../javascripts/cartodb3/components/form-components/editors/base.js');
require('../../../../../../../javascripts/cartodb3/components/form-components/editors/select/select-view.js');

describe('components/form-components/editors/select/multi-select-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe'
    });

    this.view = new Backbone.Form.editors.MultiSelect({
      key: 'names',
      schema: {
        options: ['pepe', 'paco', 'juan']
      },
      model: this.model
    });
    this.view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('components.backbone-forms.select.selected');
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
