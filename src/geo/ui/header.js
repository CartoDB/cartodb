
cdb.geo.ui.Header = cdb.core.View.extend({

  className: 'cartodb-header',

  initialize: function() {
    var extra = this.model.get("extra");

    this.model.set({
      title:            extra.title,
      description:      this._setLinksTarget(extra.description),
      show_title:       extra.show_title,
      show_description: extra.show_description
    }, { silent: true });
  },

  show: function() {

    //var display        = this.model.get("display");
    var hasTitle       = this.model.get("title") && this.model.get("show_title");
    var hasDescription = this.model.get("description") && this.model.get("show_description");

    if (hasTitle || hasDescription) {

      var self = this;

      this.$el.show();

      if (hasTitle)       self.$title.show();
      if (hasDescription) self.$description.show();

    }

  },

  // Add target attribute to all links
  _setLinksTarget: function(str) {
    if (!str) return str;
    var reg = new RegExp(/<(a)([^>]+)>/g);
    return str.replace(reg, "<$1 target=\"_blank\"$2>");
  },

  render: function() {

    this.$el.html(this.options.template(this.model.attributes));

    this.$title       = this.$el.find(".content div.title");
    this.$description = this.$el.find(".content div.description");

    if (this.model.get("show_title") || this.model.get("show_description")) {
      this.show();
    } else {
      this.hide();
    }

    return this;

  }

});
