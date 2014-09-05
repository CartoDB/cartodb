/**
 * slides lateral panel
 */

cdb.admin.SlidesPanel = cdb.core.View.extend({

  className: 'slides_panel',

  template_name: 'table/views/slides/panel',

  initialize: function() {

    this.template = this.getTemplate(this.template_name);

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

    this.slides.bind('reset' , function() {
      this.slides.each(this._add.bind(this));
    }, this);

    this.slides.bind('add', this._add, this);
    this.slides.each(this._add.bind(this));

  } ,

  _addAddButton: function(slide) {

    var v = new cdb.admin.SlideViewAdd();

    v.bind("click", function() {
      this.slides.create();
    }, this);

    this.addView(v);
    this.$el.find(".scrollpane").append(v.render().el);

  },

  _reInitScrollpane: function() {
    this.$('.scrollpane').data('jsp') && this.$('.scrollpane').data('jsp').reinitialise();
  },

  _add: function(slide) {
    var v = new cdb.admin.SlideView({ 
      model: slide, 
      count: this.slides.indexOf(slide) + 1
    });

    var self = this;

    this.addView(v);
    this.$el.find(".scrollpane .slides").append(v.render().el);

    v.show();

    this._reInitScrollpane();

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

  },

  render: function() {
    this.clearSubViews();

    this.$el.append(this.template());

    this.slides.each(this._add.bind(this));
    this._addAddButton();

    var self = this;

    setTimeout(function() {
      self.$el.find(".scrollpane").css("max-height", self.$el.height() - 60);
      self.$el.find(".scrollpane").jScrollPane();
    }, 500)

    return this;

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
    'click': '_onClick',
    'click .close': '_onClickClose'
  },

  initialize: function () {

    this.model.bind('change:active', this._changeActive, this);
    this.model.bind('remove', this._onDestroy, this);

    this.template = this.getTemplate(this.template_name);

  },

  _onDestroy: function() {
    var self = this;
    //this.clean();
    
    this.hide(function() {
      self.clean();
    });

  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.collection.setActive(this.model);

  },

  _onClickClose : function(e) {
    this.killEvent(e);
    this.model.destroy();
  },

  _changeActive: function() {

    if (this.model.isActive()) {
      this.$el.addClass("active");
    } else {
      this.$el.removeClass("active");
    }

  },

  hide: function(callback) {

    this.$el
    .removeClass('animated bounceIn')
    .addClass('animated bounceOut');

    if (callback) {
      setTimeout(function() {
        callback();
      }, 500)
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

