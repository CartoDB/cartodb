var Backbone = require('backbone');
var SizeFixedView = require('builder/components/form-components/editors/size/size-fixed-view');

describe('components/form-components/editors/size/size-fixed-view', function () {
  var sizeFixedView;

  function createView (options) {
    sizeFixedView = new SizeFixedView({
      model: new Backbone.Model({
        fixed: 5
      }),
      min: 1,
      max: 15,
      step: 2
    });
  }

  beforeEach(function () {
    createView();
  });

  afterEach(function () {
    sizeFixedView.clean();
  });

  it('renders with the expected schema', function () {
    sizeFixedView.render();

    // Schema
    var schema = sizeFixedView._formModel.schema.value;
    expect(schema).toBeDefined();
    expect(schema.type).toEqual('Number');
    expect(schema.title).toEqual('');
    expect(schema.validators.length).toBe(2);
    expect(schema.validators[0]).toEqual('required');
    expect(schema.validators[1]).toEqual(jasmine.objectContaining({
      type: 'interval',
      min: 1,
      max: 15,
      step: 2
    }));

    // Render
    expect(sizeFixedView.$('form').length).toBe(1);
    var input = sizeFixedView.$('.js-input');
    expect(input[0].value).toEqual('5');
  });

  it('change binding sets model and commit form', function () {
    sizeFixedView.render();

    var $input = sizeFixedView.$('.js-input').first();
    $input.val(10);
    sizeFixedView._formView.trigger('change');

    expect(sizeFixedView.model.get('fixed')).toEqual(10);
  });

  it('clean removes form', function () {
    sizeFixedView.render();
    expect(sizeFixedView.$('form').length).toBe(1);

    sizeFixedView.clean();

    expect(sizeFixedView.$('form').length).toBe(0);
  });
});
