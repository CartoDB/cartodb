var $ = require('jquery');
var template = require('builder/editor/style/style-form/style-aggregation-form/style-aggregation-form.tpl');

describe('editor/style/style-form/style-aggregation-form/style-aggregation-template', function () {
  it('should have proper class name for onboarding', function () {
    var content = $(template());

    expect(content.hasClass('js-aggregationOptions')).toBe(true);
  });
});
