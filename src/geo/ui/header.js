
cdb.geo.ui.Header = cdb.core.View.extend({

  className: 'cartodb-header',

  initialize: function() {
    var extra = this.model.get("extra");

    this.model.set({
      title:            extra.title,
      description:      extra.description,
      show_title:       extra.show_title,
      show_description: extra.show_description
    }, { silent: true });
  },

  show: function() {
    //var display        = this.model.get("display");
    var hasTitle       = this.model.get("title") && this.model.get("show_title");
    var hasDescription = this.model.get("description") && this.model.get("show_description");

    if (hasTitle || hasDescription) {
      this.$el.show();
      if (hasTitle)       this.$el.find(".content div.title").show();
      if (hasDescription) this.$el.find(".content div.description").show();
    }
  },

  // Add target attribute to all links
  _setLinksTarget: function(str) {
    if (!str) return str;
    var reg = new RegExp(/<(a)([^>]+)>/g);
    return str.replace(reg, "<$1 target=\"_blank\"$2>");
  },

  render: function() {
    var data = _.clone(this.model.attributes);
    data.title = cdb.core.sanitize.html(data.title);
    data.description = this._setLinksTarget(cdb.core.sanitize.html(data.description));
    this.$el.html(this.options.template(data));

    if (this.options.slides) {
      this.slides_controller = new cdb.geo.ui.SlidesController({
        transitions: this.options.transitions,
        slides: this.options.slides
      });

      this.$el.append(this.slides_controller.render().$el);
    }

    if (this.model.get("show_title") || this.model.get("show_description")) {
      this.show();
    } else {
      this.hide();
    }

    return this;

  }

});
