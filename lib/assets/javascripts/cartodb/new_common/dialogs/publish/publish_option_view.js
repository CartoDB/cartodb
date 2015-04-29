var cdb = require('cartodb.js');

/**
 * View to handle the visual representation of a publish option.
 */
module.exports = cdb.core.View.extend({

  className: 'OptionCard OptionCard--static',

  events: {
    'mouseover': '_initZClipOnce',
    'mouseleave': '_hideTipsy'
  },

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate(this.model.get('template'));
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this._template({
        model: this.model
      })
    );

    this.$el[ this.model.isDisabled() ? 'addClass' : 'removeClass' ]('is-disabled');

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  // ZClip can only be enabled if element is added to the document, so must be postponed until after (why the mouseover)
  _initZClipOnce: function(e) {
    this.killEvent(e);

    // e.g. if copyable value is still pending to be set from parent.
    if (this.model.get('initializedZClip') || this.model.isDisabled()) {
      return;
    }
    this.model.set('initializedZClip', true, { silent: true });

    this._tipsy = new cdb.common.TipsyTooltip({
      el: this._$inputEl(),
      trigger: 'manual',
      title: function() {
        return 'copied!';
      }
    });
    this.addView(this._tipsy);

    var self = this;
    this._$inputEl().zclip({
      path: cdb.config.get('assets_url') + '/flash/ZeroClipboard.swf',
      beforeCopy: function() {
        self._$inputEl().focus().select();
      },
      copy: this.model.get('copyableValue'),
      afterCopy: function() {
        self._tipsy.showTipsy();
      }
    });
  },

  _hideTipsy: function() {
    if (this._tipsy) {
      this._tipsy.hideTipsy();
    }
  },

  _$inputEl: function() {
    return this.$el.find('input');
  }
});
