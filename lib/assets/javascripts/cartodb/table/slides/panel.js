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
      model: slide
    });

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

  _initScrollPane: function() {
 
    var $scrollpane = this.$el.find(".scrollpane");
    var height      = this.$el.height();

    setTimeout(function() {
      $scrollpane.css("max-height", height - 60);
      $scrollpane.jScrollPane();
    }, 500)

  },

  render: function() {

    this.clearSubViews();

    this.$el.append(this.template());

    this.slides.each(this._add.bind(this));
    
    this.slides.setActive(this.slides.at(0));

    this._addAddButton();
    this._initScrollPane();

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
    'click .count': '_onClick',
    'click .info':  '_onClickInfo',
    'click .close': '_onClickClose'
  },

  initialize: function () {

    this._setupModel();
    this.template = this.getTemplate(this.template_name);

  },

  _setupDropdown: function() {
  
    this.dropdown = new cdb.admin.TransitionDropdown({
      target: this.$el.find('.js-change-transition-method'),
      template_base: "table/views/slides/transition_dropdown",
      tick: "center",
      vertical_offset: 90
    });

    this.addView(this.dropdown);

    cdb.god.bind("closeDialogs", this._onHideDropdown, this);

    this.$el.append(this.dropdown.render().el);

  },

  _onHideDropdown: function() {

    this.dropdown.hide();
    this.$el.css("z-index", 1);
  
  },

  _setupModel: function() {

    this.model.bind('change:active', this._onChangeActive, this);
    this.model.bind('remove',        this._onDestroy, this);

    this.model.collection.bind('add remove reset',  this._onChangeCount, this);
    this.add_related_model(this.model.collection);

  },

  _onClick: function(e) {

    this.killEvent(e);
    this.model.collection.setActive(this.model);

  },

  _onClickInfo: function(e) {

    this.killEvent(e);
    this.$el.css("z-index", 100)
    //this.dropdown.open();

  },

  _onClickClose: function(e) {
    this.killEvent(e);
    this.model.destroy();
  },

  _onDestroy: function() {
    var self = this;

    this.hide(function() {
      self.clean();
    });

  },

  _onChangeCount: function() {
    this.$el.find(".count").html(this.model.collection.indexOf(this.model) + 1);
  },

  _onChangeActive: function() {

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

    // TODO: remove count && get the value from the model
    var attributes = _.extend(this.model.attributes, { count: 1 }); 

    this.$el.append(this.template(attributes));

    this._onChangeActive();
    this._onChangeCount();

    this._setupDropdown();

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

