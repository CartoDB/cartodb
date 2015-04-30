var cdb = require('cartodb.js');
var _ = require('underscore');

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
    this.clearSubViews();

    this.$el.html(
      this._template({
        model: this.model
      })
    );
    this.$el[ this.model.isDisabled() ? 'addClass' : 'removeClass' ]('is-disabled');

    this._initZClip(false); // reset to re-enable zclip on re-render since the DOM content is replaced above

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  // ZClip can only be enabled if element is added to the document, so must be postponed until after (why the mouseover)
  _initZClipOnce: function(e) {
    if (e) this.killEvent(e);

    // e.g. if copyable value is still pending to be set from parent.
    if (this._initZClip() || this.model.isDisabled()) {
      return;
    }
    this._initZClip(true);

    this._tipsy = new cdb.common.TipsyTooltip({
      el: this._$input(),
      trigger: 'manual',
      title: function() {
        return 'copied!';
      }
    });
    this.addView(this._tipsy);

    var self = this;
    this._$input().zclip({
      path: cdb.config.get('assets_url') + '/flash/ZeroClipboard.swf',
      beforeCopy: function() {
        self._$input().focus().select();
      },
      copy: function() {
        return self._$input().val();
      },
      afterCopy: function() {
        self._tipsy.showTipsy();
        self._$input().focus().select();
      }
    });
  },

  _hideTipsy: function() {
    if (this._tipsy) {
      this._tipsy.hideTipsy();
    }
  },

  _$input: function() {
    return this.$el.find('input');
  },

  _initZClip: function(newVal) {
    if (_.isUndefined(newVal)) {
      return this.model.get('initializedZClip');
    } else {
      // silent to not cause re-render
      this.model.set('initializedZClip', newVal, { silent: true });
    }
  }
});
