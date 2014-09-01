/**
 * slides lateral panel
 */

cdb.admin.SlidesPanel = cdb.core.View.extend({

  className: 'slides_panel',

  initialize: function() {

    this.slides = this.options.slides;

    this.model = new cdb.core.Model({
      visible: false
    });

    this.model.bind("change:visible", this._onChangeVisible, this);

    if (!this.slides) {
      throw new Error("slides is undefined");
    }

    this._bindSlides();

  },

  _bindSlides: function() {

    this.add_related_model(this.slides);

    this.slides.bind('reset', function() {
      this.slides.each(this._add.bind(this));
    }, this);

    this.slides.bind('add', this._add, this);
    this.slides.bind('remove', this._remove, this);

    this._addAddButton();

  } ,

  _addAddButton: function(slide) {

    var v = new cdb.admin.SlideViewAdd();

    v.bind("click", function() {
      this.slides.create();
    }, this);

    this.addView(v);
    this.$el.append(v.render().el);

  },

  _add: function(slide) {
    var v = new cdb.admin.SlideView({ model: slide, count: this.slides.length });

    this.addView(v);
    this.$el.append(v.render().el);
    v.show();
  },

  _remove: function(slide) {

    var view = _.find(this._subviews, function(v) {
      return v.model.cid === slide.cid;
    });

    view.clean();
  },

  _onChangeVisible: function() {

    var visible = this.model.get("visible")
    visible ? this._show() : this._hide();

  },

  toggle: function() {
  
    var visible = !this.model.get("visible");
    this.model.set("visible", visible);

    return visible;

  },

  show: function() {

    this.model.set("visible", true);
  
  },

  hide: function() {
  
    this.model.set("visible", false);

  },

  _hide: function() {

    this.$el.removeClass("active");

  },

  _show: function() {

    this.$el.addClass("active");

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
    'click': '_onClick'
  },

  initialize: function () {

    this.model.bind('change:active', this._changeActive, this);

    this.template = this.getTemplate(this.template_name);

  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.collection.setActive(this.model);

  },

  _changeActive: function() {

    if (this.model.isActive()) {
      this.$el.addClass("active");
    } else {
      this.$el.removeClass("active");
    }

  },

  show: function() {

    this.$el.addClass('animated bounceIn');

  },

  render: function() {

    this.$el.attr("href", "#");

    var attributes = _.extend(this.model.attributes, this.options);

    this.$el.append(this.template(attributes));

    return this;

  }

});

cdb.admin.SlideViewAdd = cdb.admin.SlideView.extend({

  className: 'slide_view add',

  template_name: 'table/views/slides/add_slide',

  initialize: function () {

    this.template = this.getTemplate(this.template_name);

  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.trigger("click", this);

  },

  render: function() {

    this.$el.attr("href", "#");

    var attributes = this.options;

    this.$el.append(this.template(attributes));

    return this;

  }

});

