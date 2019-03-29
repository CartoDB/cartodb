var cdb = require('cartodb.js-v3');


/**
 *  Twitter category item view
 *  - It just needs a twitter category model
 */

module.exports = cdb.core.View.extend({

  className: 'TwitterCategory',

  _MAX_CATEGORIES: 4,
  _MAX_TERMS: 29,

  events: {
    'keydown .js-terms':   '_onInputChange',
    'keypress .js-terms':  '_onInputChange',
    'keyup .js-terms':     '_onInputChange'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/twitter_category');
    this._initBinds();
  },

  render: function() {
    this.$el.append(
      this.template({
        disabled: this.model.get('disabled'),        
        terms: this.model.get('terms'),
        category: this.model.get('category'),
        counter: this.model.get('counter')
      })
    );

    // Show category
    this.show();

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onInputChange');
    this.model.bind('change:category', this._onCategoryChange, this);
  },

  _onCategoryChange: function() {
    this.$('.js-category').text('Category ' + this.model.get('category'));
  },

  _onInputChange: function(e) {
    var value = $(e.target).val();

    // It was a ENTER key event? Send signal!
    if (e.keyCode === 13) {
      e.preventDefault();
      this.trigger('submit', this.model, this);
      return false;
    }

    // Change icon class
    this.$('.CDB-IconFont-twitter')[value.length > 0 ? 'addClass' : 'removeClass']('is-highlighted');

    // Check if it is possible to add new characters
    // if not, stop the action, unless user is deleting
    // any previous character
    if (( this.model.get('counter') === 0 || this.model.get('terms').length > this._MAX_TERMS) &&
      e.keyCode !== 37 /* left */ && e.keyCode !== 39 /* right */ && e.keyCode !== 8 && value.length > 0) {
      this.killEvent(e);
      this.trigger('limit', this.model, this);
      return false;
    } else {
      this.trigger('nolimit', this.model, this);
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

    d['terms'] = value;

    this.model.set(d);
  },

  show: function() {
    this.$el.addClass('enabled');
  },

  hide: function() {
    this.$el.removeClass('enabled');
  }

});