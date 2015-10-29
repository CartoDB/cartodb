cdb.geo.ui.Widget.ListModel = cdb.geo.ui.Widget.Model.extend({

  options: {
    page: 0,
    per_page: 100
  },

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  parse: function(data) {
    var rows = data.rows;
    this._data.reset(rows);
    return {
      data: rows
    };
  }
});
