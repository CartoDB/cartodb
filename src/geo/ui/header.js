
cdb.geo.ui.Header = cdb.core.View.extend({

  className: 'cartodb-header',

  initialize: function() {},

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

  render: function() {

    var self = this;

    this.$el.offset({
      top:  this.model.get("y"),
      left: this.model.get("x")
    });

    this.extra = this.model.get("extra");

    this.model.set({

      title:            this.extra.title,
      description:      this.extra.description,
      show_title:       this.extra.show_title,
      show_description: this.extra.show_description

    }, { silent: true });

    this.$el.html(this.options.template(this.model.attributes));

    this.$title       = this.$el.find(".content div.title");
    this.$description = this.$el.find(".content div.description");

    if (this.model.get("show_title") || this.model.get("show_description")) this.show();

    return this;

  }

});
