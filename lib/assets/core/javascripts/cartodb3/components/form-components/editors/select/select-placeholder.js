var Backbone = require('backbone');

Backbone.Form.editors.SelectPlaceholder = Backbone.Form.editors.Select.extend({
  initialize: function (opts) {
    Backbone.Form.editors.Select.prototype.initialize.call(this, opts);

    var placeholder = this.options.placeholder;
    this.options.selectedItemTemplate = function () {
      return placeholder;
    };
  },

  _renderButton: function (model) {
    Backbone.Form.editors.Select.prototype._renderButton.call(this, model);

    if (this.options.forcePlaceholder) {
      this._getButton().addClass('is-empty');
    }
  },

  _getLabel: function () {
    if (this.options.forcePlaceholder) {
      return this.options.placeholder;
    }

    return Backbone.Form.editors.Select.prototype._getLabel.call(this);
  },

  _hasValue: function () {
    if (this.options.forcePlaceholder) {
      return false;
    }

    return Backbone.Form.editors.Select.prototype._hasValue.call(this);
  }

});
