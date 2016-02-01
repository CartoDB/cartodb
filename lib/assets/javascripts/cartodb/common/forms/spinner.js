var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');

/** 
 *  Old form spinner
 *
 */

module.exports = cdb.core.View.extend({
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
    'change .value': '_checkValueChange'
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
  }

});