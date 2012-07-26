

(function() {

  /**
   * Create a new tags view
   */
  var SearchView = cdb.core.View.extend({

    events: {
      "submit form" : "_onSubmit"
    },

    initialize: function() {},

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
