
/**
 *  Color form view
 *
 *  - It is used in 'Marker fill', 'Polygon fill',...
 *
 */

cdb.forms.Color = cdb.core.View.extend({
  className: 'form-view form_color',

  events: {
    'click .image-picker' : '_openImagePicker',
    'click .color-picker' : '_openColorPicker'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('old_common/views/color_form');
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    this.image_property = this.options.extra ? this.options.extra.image_property: null;
    this.image_kind = this.options.extra ? this.options.extra.image_kind: null;
    this.image_kind = this.image_kind || 'marker';
  },

  render: function() {
    this.$el.html(
      this.template({
        image_kind:     this.image_kind,
        image_property: this.image_property,
        image_value:    this.model.get(this.image_property),
        color:          this.model.get(this.property)
      })
    );

    if (this.image_property)
      this._createTooltips();

    return this;
  },

  _createTooltips: function() {
    this.addView(new cdb.common.TipsyTooltip({
      el: this.$(".image-picker"),
      delayIn:  100
    }));
  },

  _createPicker: function() {

    var tick, vertical_position, horizontal_position;

    if (this.options.extra) {

      if (this.options.extra.tick) {
        tick   = this.options.extra.tick;
      }

      if (this.options.extra.picker_vertical_position) {
        vertical_position   = this.options.extra.picker_vertical_position;
      }

      if (this.options.extra.picker_horizontal_position) {
        horizontal_position = this.options.extra.picker_horizontal_position;
      }
    }

    this.color_picker = new cdb.admin.ColorPicker({

      target: this.$el,
      colors: this.options.colors,
      extra_colors: this.options.extra_colors,
      tick: tick,
      vertical_position: vertical_position,
      horizontal_position: horizontal_position

    }).bind("colorChosen", function(color, close) {

      if (this.image_property == this.property) {
        this.model.set(this.property, color);
      } else {
        this.model.unset(this.image_property, { silent: true });
        this.model.set(this.property, color);
      }

      if (close) this._destroyPicker();

    }, this);

    this._bindColorPicker();
    this.addView(this.color_picker);
  },

  _destroyPicker: function() {
    if (this.color_picker) {
      this._unbindColorPicker();
      this.removeView(this.color_picker);
      this.color_picker.hide();
      delete this.color_picker;
    }
  },

  _bindColorPicker: function() {
    cdb.god.bind("closeDialogs",        this._destroyPicker, this);
    cdb.god.bind("closeDialogs:color",  this._destroyPicker, this);
  },

  _unbindColorPicker: function() {
    cdb.god.unbind("closeDialogs",        this._destroyPicker, this);
    cdb.god.unbind("closeDialogs:color",  this._destroyPicker, this);
  },

  setExtraColors: function(colors) {
    if (this.color_picker)
      this.color_picker.setColors('extra_colors', colors);
  },
  setColors: function(colors) {
    if (this.color_picker)
      this.color_picker.setColors('colors', colors);
  },

  _openImagePicker: function(e) {
    this.killEvent(e);

    if (!this.image_property) return this;

    cdb.god.trigger("closeDialogs:color");

    this.user = new cdb.admin.User(window.user_data);

    var dialog = new cdb.editor.ImagePickerView({
      user: this.user,
      kind: this.image_kind
    });
    dialog.appendToBody();
    dialog.bind('fileChosen', this._onImageFileChosen, this);
  },

  _onImageFileChosen: function(url) {
    if (this.image_property) {
      if (this.image_property !== this.property) {
        this.model.unset(this.property, { silent: true });
      }
      this.model.set(this.image_property, 'url(' + url + ')');
    }
  },

  _openColorPicker: function(e) {
    this.killEvent(e);

    if (this.color_picker) this._destroyPicker();

    cdb.god.trigger("closeDialogs:color");

    if (!this.color_picker) {
      this._createPicker();
      $('body').append(this.color_picker.render().el);
      this.color_picker.init(this.model.get(this.property));
    }
  }

});


/**
 *  Color widget with color picker showing
 *  all colors applied in the style.
 */
cdb.forms.ColorWizard = cdb.forms.Color.extend({

  _createPicker: function() {
    // Get wizard applied colors
    if (this.model.layer && this.model.layer.get('tile_style')) {
      var style = this.model.layer.get("tile_style");
      var cartoParser = new cdb.admin.CartoParser(style);
      this.options.extra_colors = cartoParser.colorsUsed({ mode: "hex" });
    }

    cdb.forms.Color.prototype._createPicker.call(this);
  },

});


/**
 * dummy view for hidden fields
 */
cdb.forms.Hidden = cdb.core.View.extend({
  className: 'form-view form_hidden',
  initialize: function() {
    this.add_related_model(this.model);
  }
});


cdb.forms.SimpleNumber = cdb.core.View.extend({

  className: 'form-view form_spinner',

  defaults: {
    max: 999999999999,
    min: -999999999999,
    inc: 1,
    width: 25,
    pattern: /^-?[0-9]+\.?[0-9]*$/,
    debounce_time: 200,
    disable_triggering: false
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
    _.bindAll(this, '_fireChange', '_checkNumber');
    this.property = this.options.property;
    this.model.bind('change', this.render, this);

    // Check pattern, if it is empty or not valid,
    // delete the option before extending defaults
    if (!this.options.pattern ||
        typeof this.options.pattern !== "object" ||
        (typeof this.options.pattern === "object" && !this.options.pattern.test)
      )
    {
      delete this.options.pattern;
    }

    _.defaults(this.options, this.defaults);

    // Create slider
    if(!this.options.noSlider) {
      this._initSlider();
    }

    if(this.options.debounce_time > 0) {
      this._fireChange = _.debounce(this._fireChange, this.options.debounce_time);
    }
  },

  render: function(prop) {
    var value = this.options.initValue || this.model.get(this.property);

    if (prop && _.isNumber(prop)) {
      value = prop;
    }

    this.$el.html('<input class="value" ' + (this.options.disabled ? 'readonly' : '') + ' value="" style="width:' + (this.options.width) + 'px!important"/><a href="#" class="plus">+</a><a href="#" class="minus">-</a>');
    this.$('.value').val(value);

    if (this.options.classes) this.$el.addClass(this.options.classes);

    if (this.options.disabled) {
      this.undelegateEvents();
      this.$el
      .addClass('disabled')
      .find('a').bind('click', this.killEvent);
    }

    return this;
  },

  _fireChange: function() {
    this.model.change();
  },

  _changeValue: function(a) {
    this.model.set(a, { silent: true });
    this._fireChange();
  },

  inc: function(c) {
    var a = {};
    var v = a[this.property] = parseFloat(this.model.get(this.property)) + c;
    v = a[this.property] = Math.min(this.options.max, v.toFixed? v.toFixed(1): 1*v);
    a[this.property] = Math.max(this.options.min, v);
    this._changeValue(a);
    // don't wait to be notified by model, render as fast as the user changes the value
    this.render(a[this.property]);
  },

  _plus: function(e) {
    e && e.preventDefault();
    this.trigger("saved", this);
    this.inc(this.options.inc);
    return false;
  },

  _minus: function(e) {
    e && e.preventDefault();
    this.trigger("saved", this);
    this.inc(-this.options.inc);
    return false;
  },

  _initSlider: function() {
    var self = this;

    this.spinner_slider = new cdb.admin.SpinnerSlider({
      target: this.$el,
      template_base: 'old_common/views/spinner_slider'
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

    if (ev.keyCode == 40) {
      ev.preventDefault();
      ev.stopPropagation();
      this.inc(-this.options.inc);
      this._saveValue(ev);
      this.$el.find("input").focus();
      return false;
    }

    if (ev.keyCode == 38) {
      ev.preventDefault();
      ev.stopPropagation();
      this.inc(this.options.inc);
      this._saveValue(ev);
      this.$el.find("input").focus();
      return false;
    }

    // If it is an ENTER -> saves!
    if (ev.keyCode === 13) {
      this._saveValue(ev, true);
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
      this._saveValue(ev, true);
      this.value = $(ev.target).val();
    }
    return true;
  },

  _saveValue: function(ev, close) {
    var a = {};
    var val = this.$el.find("input.value").val()
    var baseNumber = (this.options.min < 0 && this.options.max > 0)?
      0:
      this.options.min;

    var number = (val == '' || val == '-') ? baseNumber : 1*val;

    if (number < this.options.min) number = this.options.min;
    if (number > this.options.max) number = this.options.max;

    this.$el.find("input.value").val(number);

    a[this.property] = number;
    this.model.set(a);

    this.trigger("saved", this);

    if (close && !this.options.disable_triggering) {
      cdb.god.trigger("closeDialogs");
    }
  },

  _showSlider: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    this.$el.find("input").focus();

  }
});

cdb.forms.SimpleNumberWithLabel = cdb.forms.SimpleNumber.extend({

  className: 'form-view form_spinner with-label',

  render: function(prop) {
    var value = this.options.initValue || this.model.get(this.property);

    if (prop && _.isNumber(prop)) {
      value = prop;
    }

    this.$el.html(
      this.getTemplate('old_common/forms/widget_simple_number_with_label')({
        label: this.options.label,
        isDisabled: this.options.disabled,
        width: this.options.width
      })
    );
    this.$('.value').val(value);

    if (this.options.classes) this.$el.addClass(this.options.classes);

    if (this.options.disabled) {
      this.undelegateEvents();
      this.$el
      .addClass('disabled')
      .find('a').bind('click', this.killEvent);
    }

    return this;
  }

});

cdb.forms.Spinner = cdb.core.View.extend({
  className: 'form-view form_spinner',

  defaults: {
    max: 999999999999,
    min: -999999999999,
    inc: 1,
    width: 25,
    pattern: /^-?[0-9]+\.?[0-9]*$/,
    debounce_time: 200
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
    _.bindAll(this, '_fireChange', '_checkNumber');
    this.property = this.options.property;
    this.model.bind('change', this.render, this);

    // Check pattern, if it is empty or not valid,
    // delete the option before extending defaults
    if (!this.options.pattern ||
        typeof this.options.pattern !== "object" ||
        (typeof this.options.pattern === "object" && !this.options.pattern.test)
      )
    {
      delete this.options.pattern;
    }

    _.defaults(this.options, this.defaults);

    // Create slider
    if(!this.options.noSlider) {
      this._initSlider();
    }

    if(this.options.debounce_time > 0) {
      this._fireChange = _.debounce(this._fireChange, this.options.debounce_time);
    }
  },

  render: function(prop) {
    var value = this.options.initValue || this.model.get(this.property);

    if (prop && _.isNumber(prop)) {
      value = prop;
    }

    this.$el.html('<input class="value" ' + (this.options.disabled ? 'readonly' : '') + ' value="" style="width:' + (this.options.width) + 'px!important"/><a href="#" class="plus">+</a><a href="#" class="minus">-</a>');
    this.$('.value').val(value);

    if (this.options.disabled) {
      this.undelegateEvents();
      this.$el
      .addClass('disabled')
      .find('a').bind('click', this.killEvent);
    }

    return this;
  },

  _fireChange: function() {
    this.model.change();
  },

  _changeValue: function(a) {
    this.model.set(a, { silent: true });
    this._fireChange();
  },

  inc: function(c) {
    var a = {};
    var v = a[this.property] = this.model.get(this.property) + c;
    v = a[this.property] = Math.min(this.options.max, v.toFixed? v.toFixed(1): 1*v);
    a[this.property] = Math.max(this.options.min, v);
    this._changeValue(a);
    // don't wait to be notified by model, render as fast as the user changes the value
    this.render(a[this.property]);
  },

  _plus: function(e) {
    e && e.preventDefault();
    this.inc(this.options.inc);
    return false;
  },

  _minus: function(e) {
    e && e.preventDefault();
    this.inc(-this.options.inc);
    return false;
  },

  _initSlider: function() {
    var self = this;

    this.spinner_slider = new cdb.admin.SpinnerSlider({
      target: this.$el,
      template_base: 'old_common/views/spinner_slider'
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

cdb.forms.SimpleOpacity = cdb.forms.SimpleNumber.extend({
  initialize: function() {
    _.defaults(this.options, {
      max: 1, min: 0, inc: 0.1
    });
    // Added correct class to the spinner
    this.$el.addClass("opacity");

    cdb.forms.Spinner.prototype.initialize.call(this);
  }
});

// same as Opacity but manages the case when the cartocss
// contains a polygon-pattern
cdb.forms.OpacityPolygon = cdb.forms.Spinner.extend({
  initialize: function() {
    _.defaults(this.options, {
      max: 1, min: 0, inc: 0.1
    });
    // Added correct class to the spinner
    this.$el.addClass("opacity");

    this.model.bind('change', function() {
      this.switchProperty();
    }, this);

    cdb.forms.Spinner.prototype.initialize.call(this);
    //this.switchProperty();

  },

  switchProperty: function() {
    if(this.model.get('polygon-pattern-file')) {
      if(!this.originalProperty) {
        this.originalProperty = this.property;
        this.property = 'polygon-pattern-opacity';
        var val = this.model.get(this.property);
        this.model.set(this.property, val === undefined ? this.model.get(this.originalProperty): val);
        this.model.unset(this.originalProperty);
      }
    } else {
      if(this.property === 'polygon-pattern-opacity') {
        this.property = this.originalProperty;
        this.originalProperty = null;
        this.model.set(this.property, this.model.get('polygon-pattern-opacity'));
        this.model.unset('polygon-pattern-opacity');
      }
    }
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

  className: 'form-view form_combo',

  options: {
    minimumResultsForSearch: 20,
    placeholder: '',
    formatResult: false,
    formatSelection: false,
    matcher: false,
    dropdownCssClass: ''
  },

  events: {
    'change select': '_changeSelection'
  },

  initialize: function() {

    _.bindAll(this, "_onUpdate", "_changeSelection");

    this.data        = this.options.extra;


    if (this.model) {
      this.add_related_model(this.model);
      this.model.bind("change:" + this.options.property, this._onUpdate, this);
    }

  },

  deselect: function() {
    this.$el.find("select").val("").change();
  },

  updateData: function(data) {

    this.data = data;
    this._onUpdate();

  },

  _onUpdate: function() {

    this.render();

  },

  _getOptions: function() {

    var options = _.map(this.data, function(option) {

      if (_.isArray(option)) {
        return '<option value="' + option[1] + '">' + option[0] + '</option>';
      } else {
        return '<option>' + option + '</option>';
      }

    }).join("");

    if (this.options.placeholder) options = "<option></option>" + options;

    return options;

  },

  _setValue: function(value) {

    this.$select.val(value);

  },

  render: function() {

    var self = this;

    // Options
    this.$select = $('<select>' + this._getOptions() + '</select>');

    // Method
    var method = this.model && this.model.get("method") && this.model.get("method").replace(/ /g,"_").toLowerCase();

    // Attributes
    this.$select.attr({
      style: (this.options.width ? "width:" + this.options.width  : '')
    });

    this.$select.addClass(this.options.property + (method ? ' ' + method : ''));

    // Disabled?
    if (this.options.disabled) this.$select.attr("disabled", '');

    // Sets the value
    this._setValue(this.model && this.model.get(this.options.property) || this.options.property);

    // Append
    this.$el.html(this.$select);

    // Apply select2, but before destroy the bindings
    if (!this.options || !this.options.plainSelect) {

      var $select = this.$("select");
      $select.select2("destroy");

      var combo_options = {
        minimumResultsForSearch:  this.options.minimumResultsForSearch,
        placeholder:              this.options.placeholder,
        dropdownCssClass:         this.options.dropdownCssClass
      };

      if (this.options.formatResult)
        combo_options.formatResult = this._formatResult;

      if (this.options.formatSelection)
        combo_options.formatSelection = this._formatSelection;

      if (this.options.matcher)
        combo_options.matcher = this._matcher;

      $select.select2(combo_options);
    }

    return this;
  },

  _changeSelection: function(e) {
    var a = {};

    var val = this.$('select').val();

    a[this.options.property] = val;

    if (this.model) {
      if (val) this.model.set(a);
      else this.model.set(a, { silent: true });
    }

    // Send trigger
    if (val) this.trigger('change', a[this.options.property]);
  },

  _formatResult: function(data) {
    return data.id || data.text;
  },

  _matcher: function(term, text, option) {
    return text.toUpperCase().indexOf(term.toUpperCase())>=0;
  },

  clean: function() {
    this.$select.select2("destroy");
    cdb.core.View.prototype.clean.call(this);
  }

});

cdb.forms.Switch = cdb.core.View.extend({

  events: {
    'click': '_onClick'
  },

  tagName: 'a',
  className: 'form-view form_switch',

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change:' + this.property, this._change, this);
  },

  _onClick: function(e) {
    e.preventDefault();

    if (!this.$el.hasClass("inactive")) {

      var a = {};
      var value = !this.model.get(this.property);
      a[this.property] = value;
      this.model.set(a);

      this.trigger("switched", this.property, value);
    }

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

cdb.forms.TextAlign = cdb.core.View.extend({

  className: 'form-view form_align',

  defaults: {
    debounce_time: 200
  },

  events: {
    'click .align': '_align'
  },

  initialize: function() {

    _.bindAll(this, '_fireChange');

    this.property = this.options.property;

    this.template = cdb.templates.getTemplate('old_common/views/text_align');

    this.model.bind('change', this.render, this);

    // Check pattern, if it is empty or not valid,
    // delete the option before extending defaults
    if (!this.options.pattern ||
        typeof this.options.pattern !== "object" ||
        (typeof this.options.pattern === "object" && !this.options.pattern.test)
      )
    {
      delete this.options.pattern;
    }

    _.defaults(this.options, this.defaults);

    if(this.options.debounce_time > 0) {
      this._fireChange = _.debounce(this._fireChange, this.options.debounce_time);
    }
  },

  _fireChange: function() {
    this.model.change();
  },

  _align: function(e) {

    e && e.preventDefault();

    var align = $(e.target).attr("data-align");

    var a = {};

    a[this.property] = align;

    this.model.set(a, { silent: true });
    this._fireChange();

  },

  render: function(prop) {

    var value = this.options.initValue || this.model.get(this.property);

    var alignments = this.options.alignments || {};

    var left   = alignments.left   === undefined ? true : alignments.left;
    var right  = alignments.right  === undefined ? true : alignments.right;
    var center = alignments.center === undefined ? true : alignments.center;

    this.$el.html(this.template({ left: left, right: right, center: center }));

    this.$el.find("a[data-align='"+ value +"']").addClass("selected");

    if (this.options.disabled) {
      this.undelegateEvents();
      this.$el
      .addClass('disabled')
      .find('a').bind('click', this.killEvent);
    }

    return this;
  },


});
