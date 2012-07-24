

(function() {

  /**
   * Create a new tags view
   */
  var SearchView = cdb.core.View.extend({

    events: {},

    initialize: function() {

      _.bindAll(this, "render");

      // If any change happened in the tables model, fetch tags model
      this.options.tables.bind('reset',   this._tableChange, this);
      this.options.tables.bind('change',  this._tableChange, this);

      this.add_related_model(this.model);
    },

    _tableChange: function() {
      var self = this;
      this.model.fetch({
        data: {limit: "5"},
        success: this.render
      });
    }
  });

  cdb.admin.dashboard.SearchView = SearchView;
})();