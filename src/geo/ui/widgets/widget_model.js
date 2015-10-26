
cdb.geo.ui.Widget.Model = cdb.core.Model.extend({

  defaults: {
    data: []
  },

  getData: function() {
    return this.get('data');
  }

});
