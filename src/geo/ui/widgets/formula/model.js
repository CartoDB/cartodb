cdb.geo.ui.Widget.FormulaModel = cdb.geo.ui.Widget.Model.extend({

  url: function() {
    return this.get('dashboardBaseURL') + '/list/' + this.get('id');
  },

  parse: function(r) {
    return {
      data: _.reduce(r, function(memo, d){
        return memo + parseInt(d.trees);
      }, 0)
    };
  }
});
