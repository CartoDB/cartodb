/**
 * slides lateral panel
 */

cdb.admin.SlidesPanel = cdb.core.View.extend({

  className: 'slides_panel',

  template_name: 'table/views/slides/panel',

  initialize: function() {

    this.template = this.getTemplate(this.template_name);

    this.slides = this.options.slides;
    this.toggleElement = this.options.toggle;

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

    this.slides.bind('remove', function() {
      this._reInitScrollpane();
    }, this);

    this.slides.bind('add', this._add, this);

  } ,

  _addAddButton: function(slide) {

    this.addSlideButton = new cdb.admin.SlideViewAdd({
      model: new cdb.core.Model()
    });

    this.addSlideButton.bind("click", function() {
      this.addSlideButton.model.set("loading", true);
      this.slides.create();
    }, this);

    this.addView(this.addSlideButton);
    this.$el.find(".scrollpane").append(this.addSlideButton.render().el);

  },

  _reInitScrollpane: function() {
    var self = this;
    setTimeout(function() {
      this.$('.scrollpane').data('jsp') && this.$('.scrollpane').data('jsp').reinitialise();
      this.$('.scrollpane.jspScrollable').css("overflow", "");
    }, 500);
  },

  _add: function(slide) {
    var v = new cdb.admin.SlideView({
      user: this.options.user,
      model: slide
    });
    // remove fake
    if (this._fakeSlide) {
      this._fakeSlide.clean();
      this._fakeSlide = null;
    }

    this._addSlideView(v);
  },

  _addSlideView: function(slideView) {
    this.addView(slideView);
    this.$el.find(".scrollpane .slides").append(slideView.render().el);

    slideView.show();
    this._reInitScrollpane();
  },

  _onChangeVisible: function() {

    var visible = this.model.get("visible")
    visible ? this._show() : this._hide();

    this.trigger("onChangeVisible", visible, this);

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
    this.toggleElement.find("h5").html("Create");
    this.toggleElement.removeClass("active");
    this.$el.removeClass("active");
    cdb.god.trigger("closeDialogs");
  },

  _show: function() {
    this.toggleElement.find("h5").html("Hide");
    this.toggleElement.addClass("active");
    this.$el.addClass("active");
  },

  _initScrollPane: function() {

    var $scrollpane = this.$el.find(".scrollpane");
    var height      = this.$el.height();

    setTimeout(function() {
      $scrollpane.css("max-height", height - 60);
      $scrollpane.jScrollPane();
      $scrollpane.css("overflow", "");
    }, 500)

  },

  _initSortable: function() {

    var self = this;

    this.$el.find(".slides").sortable({
      axis: "y",
      update : function (event, ui) {

        var current_id = ui.item.attr("id");
        var next_id = ui.item.next() ? ui.item.next().attr("id") : null;
        //var prev_id = ui.item.prev() ? ui.item.prev().attr("id") : null;

        var slide = self.slides.get(current_id);
        slide.setNext(next_id);
        //self.trigger("on_sortable", { current: current_id, next: next_id }, self);;
      }
    });

  },

  _renderFake: function() {
    this._fakeSlide = new cdb.admin.SlideViewFake();
    this._addSlideView(this._fakeSlide);
  },

  render: function() {

    this.clearSubViews();

    this.$el.append(this.template());

    this._renderFake();

    this.slides.each(this._add.bind(this));

    this._addAddButton();
    this._initScrollPane();
    this._initSortable();

    this.slides.bind("add", function() {
      this.addSlideButton.model.set("loading", false);
    }, this);

    return this;

  }

});

/**
 * view for the fake slide. When there are no slides the UI shows one (the master one) but it's not
 * an actual slide in the server.
 */

cdb.admin.SlideViewFake = cdb.core.View.extend({

  tagName: "a",

  className: 'slide_view fake',

  template_name: 'table/views/slides/slide',

  initialize: function () {
    this.template = this.getTemplate(this.template_name);
  },

  show: function() {
    this.$el.addClass('animated bounceIn active');
  },

  render: function() {
    this.$el.attr("href", "#");
    this.$el.append(this.template({ count: 1, transition: false }));
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
    'click':        '_onClick',
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
      horizontal_position: "left",
      tick: "top",
      vertical_offset: 58,
      horizontal_offset: -145,
      vis: this.model.visualization
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
    this.model.visualization.bind('change:transition_options', this._onChangeTransitionOptions, this);
    this.model.bind('remove',        this._onDestroy, this);

    this.model.collection.bind('add remove reset change:next_id', this._onChangeCount, this);
    this.add_related_model(this.model.collection);

  },

  _onClick: function(e) {
    this.killEvent(e);
    this.model.collection.setActive(this.model);
  },

  _onClickInfo: function(e) {
    this.killEvent(e);
    this.$el.css("z-index", 100)
  },

  _onClickClose: function(e) {
    this.killEvent(e);

    var delete_confirmation
    if (this.options.user.featureEnabled('new_modals')) {
      delete_confirmation = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_delete_slide');
    } else {
      delete_confirmation = new cdb.admin.BaseDialog({
        title: "Delete slide",
        descriptionSafeHtml: "Are you sure you want to delete this slide?",
        template_name: 'old_common/views/confirm_dialog',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: "Yes, do it",
        cancel_button_classes: "underline margin15",
        cancel_title: "Cancel",
        modal_type: "confirmation",
        width: 500
      });
    }

    // If user confirms, remove slide
    var self = this;
    delete_confirmation.ok = function() {
      self.model.destroy();
    };

    delete_confirmation
      .appendToBody()
      .open();
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

  _onChangeTransitionOptions: function() {

    var transition_method = this._getTransitionMethod();

    this.$el.find(".js-change-transition-method").html(transition_method);

  },

  _onChangeActive: function() {

    if (this.model.isActive()) {
      this.$el.addClass("active");
    } else {
      this.$el.removeClass("active");
    }
    cdb.god.trigger("closeDialogs");

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

  _getTransitionMethod: function() {

    var transition = this.model.visualization.get("transition_options");
    var transition_method = "on click";

    if (transition && transition.transition_trigger === "time") {
      transition_method = (transition.time !== 1) ? transition.time + " seconds" : "1 second";
    }

    return transition_method;

  },

  show: function() {
    this.$el.addClass('animated bounceIn');
  },

  render: function() {

    this.$el.attr("href", "#");

    // TODO: remove count && get the value from the model
    var attributes = _.extend(this.model.attributes, { count: 1, transition: true, transition_method: this._getTransitionMethod() });

    this.$el.append(this.template(attributes));

    this._onChangeActive();
    this._onChangeCount();

    this._setupDropdown();

    this.$el.attr("id", this.model.get("id"))

    return this;

  }

});

cdb.admin.SlideViewAdd = cdb.admin.SlideView.extend({

  className: 'slide_view add',

  template_name: 'table/views/slides/add_slide',

  _setupModel: function() {
    this.model.bind('change:loading', this._onChangeLoading, this);
  },

  _onChangeLoading: function(e) {

    if (this.model.get("loading")) {
      this.$el.addClass("loading");
    } else {
      this.$el.removeClass("loading");
    }

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
