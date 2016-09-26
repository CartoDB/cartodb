var _ = require('underscore');
var Backbone = require('backbone');

var LegendModelBase = Backbone.Model.extend({

  // Subclasses of this class can override this "constant" and
  // specify a list of attrs that are included in the defaults but
  // should NOT be resetted by .reset()
  NON_RESETEABLE_DEFAULT_ATTRS: [],

  defaults: function () {
    var type = this.constructor.prototype.TYPE;
    if (!type) throw new Error('Subclasses of LegendModelBase must have a TYPE');
    return {
      type: type,
      visible: false,
      title: '',
      preHTMLSnippet: '',
      postHTMLSnippet: ''
    };
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isVisible: function () {
    return this.get('visible');
  },

  reset: function () {
    var defaults = _.omit(this.defaults(),
      'visible',
      this.NON_RESETEABLE_DEFAULT_ATTRS
    );
    this.set(defaults);
  }
});

module.exports = LegendModelBase;
