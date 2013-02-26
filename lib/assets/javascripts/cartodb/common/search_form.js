/**
* Header search form
*
* It will work differently if it is in "user dashboard" or in "settings", "keys",...
*/
cdb.ui.common.SearchView = cdb.core.View.extend({

  events: {
    "submit form" : "_onSubmit"
  },

  initialize: function() {

    this.model      = new cdb.core.Model();

    this.model.bind('change:visible', this._toggleVisibility, this);

    // Check if we are in dashboard or in other place
    if (window.location.pathname.search("dashboard") == -1) {
      this.type = window.location.pathname;
    } else {
      this.type = "dashboard";
    }
  },

  _toggleVisibility: function() {
    if (this.model.get("visible")) this._show();
    else this._hide();
  },

  _show: function() {
    this.$el.animate({ marginTop: 0 }, 250);
  },

  _hide: function() {
    this.$el.animate({ marginTop: "-100px" }, 250);
  },

  _onSubmit: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    var q = $(ev.target).find('input[type="text"]').val()
    , dashboard = (this.type == "dashboard" ? '' : "/dashboard/")

    if (q != "") {
      window.location.href = dashboard + "#/search/" + q + "/1";
    } else {
      window.location.href = dashboard + "#/";
    }
  }
});
