/**
* Header search form
*
* It will work differently if it is in "user dashboard" or in "settings", "keys",...
*/
cdb.ui.common.SearchView = cdb.core.View.extend({

  default_options: {
    template_base: 'dashboard/views/search_view'
  },

  events: {
    "submit form" : "_onSubmit"
  },

  initialize: function() {

    this.model = new cdb.core.Model();

    // Extend options
    _.defaults(this.options, this.default_options);

    this.model.bind('change:visible', this._toggleVisibility, this);
    this.model.bind('change:q',       this._updateQuery, this);

    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Check if we are in dashboard or in other place
    if (window.location.pathname.search("dashboard") == -1) {
      this.type = window.location.pathname;
    } else {
      this.type = "dashboard";
    }

    this.render();
  },

  setQuery: function(q) {
    if (q) this.model.set("q", q);
    else this.model.set("q", "");
  },

  _updateQuery: function() {
    var q = this.model.get("q");
    this.$el.find('input[type="text"]').val(q);
  },

  _toggleVisibility: function() {
    if (this.model.get("visible")) this._show();
    else this._hide();
  },

  show: function() {
    this.model.set("visible", true);
  },

  hide: function() {
    this.model.set("visible", false);
  },

  _show: function() {
    this.$el.animate({ marginTop: 0, opacity: 1 }, 250);
  },

  _hide: function() {
    this.$el.animate({ marginTop: "-100px", opacity: 0 }, 250);
  },

  _onSubmit: function(ev) {

    ev.preventDefault();
    ev.stopPropagation();

    var q = this.$el.find('input[type="text"]').val();

    this.trigger("search", q, this);

  },

  render: function() {

    var content = this.template_base(this.model.toJSON());
    this.$el.append(content);

    return this;

  }

});
