/**
 * slides lateral panel
 */

cdb.admin.SlidesPanel = cdb.core.View.extend({

  className: 'slides_panel',

  initialize: function() {
    this.slides = this.options.slides;
    if (!this.slides) {
      throw new Error("slides is undefined");
    }

    this.add_related_model(this.slides);
    this.slides.bind('reset', function() {
      this.slides.each(this._add.bind(this));
    }, this);
    this.slides.bind('add', this._add, this);
    this.slides.bind('remove', this._remove, this);
  },

  _add: function(slide) {
    var v = new cdb.admin.SlideView({ model: slide, count: this.slides.length });
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _remove: function(slide) {
    var view = _.find(this._subviews, function(v) {
      return v.model.cid === slide.cid;
    });
    view.clean();
  }

});

/**
 * view for a single slide
 */
cdb.admin.SlideView = cdb.core.View.extend({

  tagName: "a",

  className: 'slide_view',

  template_name: 'table/views/slides/slide',

  events: {
    'click': '_click'
  },

  initialize: function () {

    this.model.bind('change:active', this._changeActive, this);

    this.template = this.getTemplate(this.template_name);

  },

  render: function() {

    this.$el.attr("href", "#");

    var attributes = _.extend(this.model.attributes, this.options);

    this.$el.append(this.template(attributes));

    return this;

  },

  _click: function() {
    this.model.collection.setActive(this.model);
  },

  _changeActive: function() {
    //TODO: do this with a class
    if (this.model.isActive()) {
      this.$el.addClass("active");
    } else {
      this.$el.removeClass("active");
    }
  }

});

