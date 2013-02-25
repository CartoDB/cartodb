
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


/**
 * dummy view for hidden fields
 */
cdb.forms.Hidden = cdb.core.View.extend({
  className: 'form_hidden',
  initialize: function() {
    this.add_related_model(this.model);
  }
});


cdb.forms.Spinner = cdb.core.View.extend({
  className: 'form_spinner',

  defaults: {
    max: 999999999999,
    min: -999999999999,
    inc: 1,
    width: 25,
    pattern: /^-?[0-9]+\.?[0-9]*$/
  },

  events: {
    'click .plus': '_plus',
    'click .minus': '_minus',
    'keypress input.value': '_checkInputPress',
    'keydown input.value': '_checkInputPress',
    'keyup input.value': '_checkInputUp',
    'change .value': '_checkValueChange',
    'click': '_showSlider'
  },

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    _.defaults(this.options, this.defaults);
    this.add_related_model(this.model);

    // Create slider
    if(!this.options.noSlider) {
      this._initSlider();
    }
  },

  render: function() {
    this.$el.html('<input class="value" ' + (this.options.disabled ? 'readonly' : '') + ' value="" style="width:' + (this.options.width) + 'px!important"/><a href="#" class="plus">+</a><a href="#" class="minus">-</a>');
    this.$('.value').val(this.model.get(this.property));

    if (this.options.disabled) {
      this.undelegateEvents();
      this.$el.find('a').bind('click', this.killEvent);
    }

    return this;
  },

  inc: function(c) {
    var a = {};
    var v = a[this.property] = this.model.get(this.property) + c;
    v = a[this.property] = Math.min(this.options.max, v.toFixed? v.toFixed(1): 1*v);
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
      self.$el.find(".value").val(value);
    });
    this.addView(this.spinner_slider);
  },

  _checkNumber: function(number) {
    return this.options.pattern.test(number);
  },

  _checkInputPress: function(ev) {
    var newChar = String.fromCharCode(ev.charCode);

    if(newChar == '-' || newChar == '.' || 1*newChar !== NaN) {
      return true;
    } else {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    }
  },

  _checkInputUp: function(ev) {
    this.value? null : this.value = this.model.get(this.property);
    var number = $(ev.target).val();

    // If it is an ENTER -> saves!
    if (ev.keyCode === 13) {
      this._saveValue(ev);
      return false;
    }
    // If not, check the key
    if (!this._checkNumber(number) && number != '-' && number != '') {
      this.$el.find("input.value").val(this.value);
      // ev.stopPropagation();
      // ev.preventDefault();
    } else {
      if(number != '-' && number != '') {
        this.value = $(ev.target).val();
      }
    }
    return true;
  },

  _checkValueChange: function(ev) {
    var number = $(ev.target).val();
    number = (number == '' || number == '-')? 0 : 1*number
    if (!this._checkNumber(number)) {
      this.$el.find("input.value").val(this.value);
    } else {
      this._saveValue(ev);
      this.value = $(ev.target).val();
    }
    return true;
  },

  _saveValue: function(ev) {
    var a = {};
    var val = this.$el.find("input.value").val()
    var baseNumber = (this.options.min < 0 && this.options.max > 0)?
      0:
      this.options.min;

    var number = (val == '' || val == '-') ? baseNumber : 1*val;

    this.$el.find("input.value").val(number);

    a[this.property] = number;
    this.model.set(a);

    cdb.god.trigger("closeDialogs");
  },

  _showSlider: function(ev) {
    if(!this.options.noSlider) {
      ev.stopPropagation();

      cdb.god.unbind("closeDialogs", this.spinner_slider.hide, this.spinner_slider);
      cdb.god.trigger("closeDialogs");

      if (!this.spinner_slider.el.parentElement) {
        $('body').append(this.spinner_slider.render().el);

        this.spinner_slider.init(this.options.max, this.options.min, this.options.inc, this.$el.find("input.value").val());

        cdb.god.bind("closeDialogs", this.spinner_slider.hide, this.spinner_slider);
        cdb.god.bind("closeDialogs:color", this.spinner_slider.hide, this.spinner_slider);
      }

      this.$el.find("input.value").focus();
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
    this.bind("clean", this.reClean);

    if (this.model) {
      this.model.bind('change', this.render, this);
      this.add_related_model(this.model);
    }
  },

  render: function() {
    var options = _(this.options.extra).map(function(v) {
      if(_.isArray(v)) {
        return '<option value=' + v[1] + '>' + v[0] + '</option>';
      } else {
        return '<option>' + v + '</option>';
      }
    });

    // Add an empty option to prevent errors with placeholder
    if (options == "")
      options += '<option></option>';

    // Method
    var method = this.model && this.model.get("method") && this.model.get("method").replace(/ /g,"_").toLowerCase();

    // Options
    var $new_select = $('<select>' + options + '</select>');

    // Attributes
    $new_select.attr({
      "class": this.options.property + " " + (method ? method : ''),
      "style": (this.options.width ? "width:" + this.options.width  : '')
    });

    // Disabled?
    if (this.options.disabled) $new_select.attr("disabled", '');
    
    // Value
    $new_select.val(this.model && this.model.get(this.property) || this.property);

    // Append
    this.$el.html($new_select);

    // Apply select2, but before destroy the bindings
    if(!this.options || !this.options.plainSelect) {
      var $select = this.$("select");
      $select.select2("destroy");
      $select.select2({
        minimumResultsForSearch: 20,
        placeholder: this.options.placeholder || ""
      });
    }
    return this;
  },

  _changeSelection: function(e) {
    var a = {};
    a[this.property] = this.$('select').val();

    // Save model
    if (this.model)
      this.model.set(a);

    // Send trigger
    this.trigger('change', a[this.property]);
  },

  _reClean: function() {
    $select.select2("destroy");
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
