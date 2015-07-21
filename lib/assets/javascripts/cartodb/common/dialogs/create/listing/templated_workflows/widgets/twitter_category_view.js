var cdb = require('cartodb.js');


/**
 *  Twitter category item view for workflow templates
 *
 */
module.exports = cdb.core.View.extend({

  className: '',

  _MAX_TERMS: 29,

  events: {
    'keydown .js-terms':   '_onInputChange',
    'keypress .js-terms':  '_onInputChange',
    'keyup .js-terms':     '_onInputChange'
  },

  options: {
    property: 'terms'
  },

  initialize: function() {
    if (!this.model) {
      this.model = new cdb.core.Model();
    }

    // Set property
    var obj = {};
    obj[this.options.property] = [];
    this.model.set(obj);

    this.template = cdb.templates.getTemplate('common/dialogs/create/listing/templated_workflows/widgets/twitter_category');
    this._initBinds();
  },

  render: function() {
    var self = this;

    this.$el.append(
      this.template({
        terms: this.model.get(this.options.property)
      })
    );

    this.addView(new cdb.common.TipsyTooltip({
      el: this.$el,
      title: function(e) {
        return self.model.getError && self.model.getError()
      }
    }));

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onInputChange');
    this.model.bind('error valid', this._onModelValidChange, this);
  },

  _onModelValidChange: function() {
    var error = this.model.getError && this.model.getError();
    this.$('.js-terms').toggleClass('Form-input--error', error !== '');
  },

  _onInputChange: function(e) {

    // It was a ENTER key event? Send signal!
    if (e.keyCode === 13) {
      e.preventDefault();
      return false;
    }

    var $input = $(e.target);
    var value = $input.val();
    var d = {};

    // Get valid terms array
    if (!value) {
      value = [];
    } else {
      value = value.split(',');
    }

    d[this.options.property] = value;
    this.model.set(d);
  }

});