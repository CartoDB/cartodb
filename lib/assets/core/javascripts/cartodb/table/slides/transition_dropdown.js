/**
 * this method creates a new Model in sync with the specicied one. Also takes a method to be executed every time the proxy model changes
 * returns the proxy model, an instance of Backbone.Model, it's not an instance of original model
 */
function proxyModel(m, fn) {
  var proxyModel = new Backbone.Model();
  proxyModel.set(m.attributes);
  var signalDisabled = false;

  fn = fn || function() {
    m.set(proxyModel.attributes);
  }

  m.bind('change', function() {
    signalDisabled = true;
    proxyModel.set(m.attributes);
    signalDisabled = false;
  }, proxyModel);

  proxyModel.bind('change', function() {
    if (signalDisabled) return;
    fn(m, proxyModel);
  }, m);

  proxyModel.unlink = function() {
    m.unbind(null, null, proxyModel);
    proxyModel.unbind(null, null, m);
  }

  return proxyModel;
}

cdb.admin.TransitionDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown slide_transition_dropdown',

  defaults: {
    speedOut: 100,
    speedIn: 100
  },

  events: {
    "click" : "killEvent",
    'click .radiobutton': '_onClickRadioButton'
  },

  initialize: function() {
    var self = this;

    _.bindAll(this, "open", "hide", "_handleClick", "_onKeyDown");

    // Extend options
    _.defaults(this.options, this.defaults);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.vis = this.options.vis;

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});

    // Bind ESC key
    // TODO: unbind
    $(document).bind('keydown', this._onKeyDown);

    this.formModel = proxyModel(this.vis.transition, function(m, proxy) {
      // since the visualization model may not be loaded fetch it and save
      function _save() {
          m.set(proxy.attributes);
          self.vis.save();
      }
      if (!self.vis.isLoaded()) {
        self.vis.fetch({
          success: function() {
            _save();
          }
        });
      } else {
        _save();
      }
    })

    this.on('clean', function() {
      this.formModel.unlink();
    })

    this.formModel.on("change:transition_trigger", this._onChangeTransitionTrigger, this);
    this.formModel.on("change:time", this._onChangeTime, this);

    // flags
    this.isOpen    = false;
  },

  /* Check if the dropdown is visible to hiding with the click on the target */
  _handleClick: function(ev) {
    if (ev) {
      ev.preventDefault();
    }

    // If visible
    if (this.isOpen){
      this.hide();
    } else{
      this.open();
    }
  },

  _onClickRadioButton: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var $el = $(e.target);
    var transitionType = $el.attr("data-transition");

    this.$el.find(".radiobutton").removeClass("selected");
    $el.addClass("selected");

    //this.formModel.set("time", 0);
    this.formModel.set({
      transition_trigger: transitionType
    })

  },

  _selectTimeEvent: function() {
    this.$el.find(".radiobutton").removeClass("selected");
    this.$el.find("a[data-transition='time']").addClass("selected");
  },

  _selectOnClickEvent: function() {
    this.$el.find(".radiobutton").removeClass("selected");
    this.$el.find("a[data-transition='click']").addClass("selected");
  },

  _onChangeTime: function() {

    var time = this.formModel.get("time");

    if (time === 0 || !time) {
      this._selectOnClickEvent();
    } else {
      this._selectTimeEvent();
    }

  },

  _onChangeTransitionTrigger: function() {

    var trigger = this.formModel.get("transition_trigger");

    if (trigger === "click" || !trigger) {
      this._selectOnClickEvent();
    } else {
      this._selectTimeEvent();
    }

  },

  show: function() {

    var dfd = $.Deferred();
    var self = this;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      marginTop: "-10px",
      opacity:0,
      display:"block"
    })
    .animate({
      margin: "0",
      opacity: 1
    }, {
      "duration": this.options.speedIn,
      "complete": function(){
        dfd.resolve();
      }
    });

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();
  },

  open: function(ev, target) {

    cdb.god.trigger("closeDialogs");

    // Target
    var $target = target && $(target) || this.options.target;

    this.options.target = $target;

    this.$el.css({
      top: this.options.vertical_offset,
      right: this.options.horizontal_offset 
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "border tick_" + this.options.tick
    );

    // Show it
    this.show();
    this._recalcHeight();

    // Dropdown open
    this.isOpen = true;
  },

  _onKeyDown: function(e) {

    if (e.keyCode === 27) {
      this.hide();
    }

  },


  hide: function(done) {

    if (!this.isOpen) {
      done && done();
      return;
    }

    var self    = this;
    this.isOpen = false;

    this.$el.animate({
      marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
      opacity: 0
    }, this.options.speedOut, function(){

      // And hide it
      self.$el.hide();

    });

    this.trigger("onDropdownHidden",this.el);
  },

  _recalcHeight: function() {

    var $ul  = this.$el.find("ul.special");

    // Resets heights
    $ul.height("auto");
    $ul.parent().height("auto");

    var special_height  = $ul.height();
    var dropdown_height = $ul.parent().height();

    // Sets heights
    if (special_height < dropdown_height) $ul.css("height", dropdown_height);
    else $ul.parent().height(special_height);

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    var number = new cdb.forms.SimpleNumber({
      model: this.formModel,
      property: "time",
      max: 120,
      min: 1,
      inc: 1
    });

    number.bind("saved", function(a) {
      this.formModel.set("transition_trigger", "time");
    }, this);

    this.$el.find("li.seconds .form").append(number.render().$el);
    this._onChangeTransitionTrigger();

    return this;
  }

});
