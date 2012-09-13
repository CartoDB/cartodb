
cdb.forms.Color = cdb.core.View.extend({
  className: 'form_color',

  events: {
    'click' : '_openPicker'
  },

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    this.add_related_model(this.model);
    this._initPicker();
  },

  render: function() {
    this.$el.html('<span class="color"></span><a href="#choose_color" class="picker">+</a>');
    this.$('.color').css('background-color', this.model.get(this.property));
    return this;
  },

  _initPicker: function() {
    var self = this;

    this.color_picker = new cdb.admin.ColorPicker({
      target: this.$el,
      template_base: 'common/views/color_picker'
    }).bind("colorChosen", function(color) {
      // Set new model
      self.model.set(self["property"], color);
    });
    this.addView(this.color_picker);
  },

  _openPicker: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    cdb.god.unbind("closeDialogs", this.color_picker.hide, this.color_picker);
    cdb.god.unbind("closeDialogs:color", this.color_picker.hide, this.color_picker);

    cdb.god.trigger("closeDialogs:color");

    if (!this.color_picker.el.parentElement) {
      $('body').append(this.color_picker.render().el);
      this.color_picker.init(this.model.get(this.property));
      
      cdb.god.bind("closeDialogs", this.color_picker.hide, this.color_picker);
      cdb.god.bind("closeDialogs:color", this.color_picker.hide, this.color_picker);
    } else {
      this.color_picker.hide();
    }
  }
});

cdb.forms.Spinner = cdb.core.View.extend({
  className: 'form_spinner',

  defaults: {
    max: 999999999999,
    min: -999999999999,
    inc: 1
  },

  events: {
    'click .plus': '_plus',
    'click .minus': '_minus',
    'click': '_showSlider'
  },

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    _.defaults(this.options, this.defaults);
    this.add_related_model(this.model);

    // Create slider
    this._initSlider();
  },

  render: function() {
    this.$el.html('<span class="value"></span><a href="#" class="plus">+</a><a href="#" class="minus">-</a>');
    this.$('.value').html(this.model.get(this.property));
    return this;
  },

  inc: function(c) {
    var a = {};
    var v = a[this.property] = this.model.get(this.property) + c;
    v = a[this.property] = Math.min(this.options.max, v.toFixed(1));
    a[this.property] = Math.max(this.options.min, v);
    this.model.set(a);
  },

  _plus: function(e) {
    e.preventDefault();
    this.inc(this.options.inc);
    return false;
  },

  _minus: function(e) {
    e.preventDefault();
    this.inc(-this.options.inc);
    return false;
  },

  _initSlider: function() {
    var self = this;

    this.spinner_slider = new cdb.admin.SpinnerSlider({
      target: this.$el,
      template_base: 'common/views/spinner_slider'
    }).bind("valueSet", function(value) {
      // Set new model
      var a = {};
      a[self.property] = value;
      self.model.set(a);
    }).bind("valueChanged", function(value) {
      // Set new value
      self.$el.find("span").text(value);
    });
    this.addView(this.spinner_slider);
  },

  _showSlider: function(ev) {
    ev.stopPropagation();

    cdb.god.unbind("closeDialogs", this.spinner_slider.hide, this.spinner_slider);
    cdb.god.trigger("closeDialogs");

    if (!this.spinner_slider.el.parentElement) {
      $('body').append(this.spinner_slider.render().el);
        
      this.spinner_slider.init(this.options.max, this.options.min, this.options.inc, this.$el.find("span").text());

      cdb.god.bind("closeDialogs", this.spinner_slider.hide, this.spinner_slider);
      cdb.god.bind("closeDialogs:color", this.spinner_slider.hide, this.spinner_slider);
    } else {
      this.spinner_slider.hide();
    }
  }
});

cdb.forms.Opacity = cdb.forms.Spinner.extend({
  initialize: function() {
    _.defaults(this.options, {
      max: 1, min: 0, inc: 0.1
    });
    // Added correct class to the spinner
    this.$el.addClass("opacity");
    
    cdb.forms.Spinner.prototype.initialize.call(this);
  }
});

cdb.forms.Width = cdb.forms.Spinner.extend({
  initialize: function() {
    _.defaults(this.options, {
      max: 40, min: 0, inc: 0.5
    });
    cdb.forms.Spinner.prototype.initialize.call(this);
  }
});

cdb.forms.Combo = cdb.core.View.extend({
  className: 'form_combo',

  events: {
    'change select': '_changeSelection'
  },

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    this.bind("clean", this.reClean);
    this.add_related_model(this.model);
  },

  render: function() {
    var options = _(this.options.extra).map(function(v) {
      if(_.isArray(v)) {
        return '<option value=' + v[1] + '>' + v[0] + '</option>';
      } 
      return '<option>' + v + '</option>';
    });

    var method = this.model.get("method") && this.model.get("method").replace(/ /g,"_").toLowerCase();

    this.$el.html('<select class="' + this.options.property + " " + (method ? method : '') +'" style="' + (this.options.width ? "width:" + this.options.width  : '') + '">' + options + '</select>');
    this.$('select').val(this.model.get(this.property));

    // Apply select2, but before destroy the bindings
    var $select = this.$("select");
    $select.select2("destroy");
    $select.select2({
      minimumResultsForSearch: 10
    });

    return this;
  },

  _changeSelection: function(e) {
    var a = {};
    a[this.property] = this.$('select').val();
    this.model.set(a);
  },

  _reClean: function() {
    console.log("jamon");
  }
});

cdb.forms.Switch = cdb.core.View.extend({

  events: {
    'click': '_onClick'
  },
  tagName: 'a',
  className: 'form_switch',

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change:' + this.property, this._change, this);
  }, 

  _onClick: function(e) {
    e.preventDefault();
    var a = {};
    a[this.property] = !this.model.get(this.property);
    this.model.set(a);

    return false;
  },

  _change: function() {
    if(this.model.get(this.property)) {
      this.$el.removeClass('disabled').addClass('enabled');
    } else {
      this.$el.removeClass('enabled').addClass('disabled');
    }
  },

  render: function() {
    this.$el.append("<span class='handle'></span>");
    this._change();
    return this;
  }

});
