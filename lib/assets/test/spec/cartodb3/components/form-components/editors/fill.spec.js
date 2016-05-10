var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base.js');
require('../../../../../../javascripts/cartodb3/components/form-components/editors/fill.js');

fdescribe('components/form-components/editors/fill', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe'
    });

    this.view = new Backbone.Form.editors.Fill({
      key: 'names',
      schema: {
        columns: ['pepe', 'paco', 'juan'],
        inputs: {
          size: {
            range: [1, 30],
            attribute: 'the_geom',
            quantification: 'Quantile'
          },
          color: {
            bins: 5,
            range: ['#FFF', '#FABADA', '#00FF00', '#000', '#99999'],
            attribute: 'name',
            operation: 'multiply',
            quantification: 'Jenks',
            opacity: 0.5
          }
        }
      },
      model: this.model
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.CDB-OptionInput-item').length).toBe(2);
    expect(this.view.$el.text()).toContain('1..30');
    expect(this.view.$el).toContain('#00FF00');
  });

  afterEach(function () {
    this.view.remove();
  });
});
