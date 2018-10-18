var Backbone = require('backbone');
var ValidatorClass = require('builder/components/form-components/validators/column-type');

var Validator = ValidatorClass({
  type: 'columnType',
  columnsCollection: new Backbone.Collection([
    { name: 'cartodb_id', type: 'number' },
    { name: 'title', type: 'string' },
    { name: 'created_at', type: 'date' }
  ]),
  columnType: 'number'
});

var error = { type: 'columnType', message: 'components.backbone-forms.column-type-error' };

describe('components/form-components/validators/column-type', function () {
  it('returns an error if there is no column with that name or the column doesnt match the type', function () {
    expect(Validator('this_column_does_not_exist')).toEqual(error);
    expect(Validator('title')).toEqual(error);
  });

  it('returns undefined if the column matches the type', function () {
    expect(Validator('cartodb_id')).toBe(undefined);
  });
});
