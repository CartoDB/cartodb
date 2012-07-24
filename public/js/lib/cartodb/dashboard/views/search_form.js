
cdb.admin.dashboard = cdb.admin.dashboard || {};


(function() {

  /**
   * Create a new tags view
   */
  var SearchView = cdb.core.View.extend({

    events: {
      "submit form" : "_onSubmit"
    },

    initialize: function() {

      // _.bindAll(this, "render");

      // // If any change happened in the tables model, fetch tags model
      // this.options.tables.bind('reset',   this._tableChange, this);
      // this.options.tables.bind('change',  this._tableChange, this);

      // this.add_related_model(this.model);
    },

    _onSubmit: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var q = $(ev.target).find('input[type="text"]').val();
      
      if (q != "") {
        window.location.href = "#/search/" + q + "/1";  
      } else {
        window.location.href = "#/";  
      }
    }
  });

  cdb.admin.SearchView = SearchView;
})();