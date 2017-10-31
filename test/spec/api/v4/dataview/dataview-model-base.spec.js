var dataviews = require('../../../../../src/api/v4/dataview/index');



describe('dataviews-v4', function () {
  fit('create a formula dataview', function () {

    var formulaDataview = new dataviews.Formula(null, {
      column: 'price',
      params: {
        operation: dataviews.AGGREGATIONS.COUNT
      }
    });
    debugger;
  });
});
