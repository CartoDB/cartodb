var template = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/deprecated-sql-function.tpl');

describe('deprecated-sql-function-form-template', function () {
  it('should have `primary_source` and `function_name` as data fields', function () {
    var html = template({fields: []});

    expect(html).toContain('data-fields="primary_source,function_name"');
  });

  it('should have the given data fields', function () {
    var html = template({fields: ['secondary_source', 'radius']});

    expect(html).toContain('data-fields="secondary_source,radius"');
  });
});
