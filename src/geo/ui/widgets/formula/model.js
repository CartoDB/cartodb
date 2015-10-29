cdb.geo.ui.Widget.FormulaModel = cdb.geo.ui.Widget.Model.extend({

  // TODO: The response format has probably changed
  parse: function(r) {
    return {
      data: _.reduce(r, function(memo, d) {
        return memo + parseInt(d.trees);
      }, 0)
    };
  }
});
