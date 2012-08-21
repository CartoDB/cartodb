
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
    })

  },

  _openPicker: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    cdb.god.unbind("closeDialogs", this.color_picker.hideAndClean, this.color_picker);
    cdb.god.unbind("closeDialogs:color", this.color_picker.hideAndClean, this.color_picker);

    cdb.god.trigger("closeDialogs:color");

    if (!this.color_picker.el.parentElement) {
      $('body').append(this.color_picker.render().el);
      this.color_picker.init(this.model.get(this.property));
      
      cdb.god.bind("closeDialogs", this.color_picker.hideAndClean, this.color_picker);
      cdb.god.bind("closeDialogs:color", this.color_picker.hideAndClean, this.color_picker);
    } else {
      this.color_picker.hideAndClean();
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
    'click .minus': '_minus'
  },

  initialize: function() {
    this.property = this.options.property;
    this.model.bind('change', this.render, this);
    _.defaults(this.options, this.defaults);
    this.add_related_model(this.model);
  },

  inc: function(c) {
    var a = {};
    var v = a[this.property] = this.model.get(this.property) + c;
    v = a[this.property] = Math.min(this.options.max, v);
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

  render: function() {
    this.$el.html('<span class="value"></span><a href="#" class="plus">+</a><a href="#" class="minus">-</a>');
    this.$('.value').html(this.model.get(this.property));
    return this;
  }

});

cdb.forms.Opacity = cdb.forms.Spinner.extend({
  initialize: function() {
    _.defaults(this.options, {
      max: 1, min: 0, inc: 0.1
    });
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
    this.add_related_model(this.model);
  },

  render: function() {
    var options = _(this.options.extra).map(function(v) {
      return '<option>' + v + '</option>';
    });
    this.$el.html('<select>' + options + '</select>');
    this.$('select').val(this.model.get(this.property));

    // Apply select2
    this.$("select").select2({
      minimumResultsForSearch: 10
    });

    return this;
  },

  _changeSelection: function(e) {
    var a = {};
    a[this.property] = this.$('select').val();
    this.model.set(a);
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
