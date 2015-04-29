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
    this._template = cdb.templates.getTemplate('new_common/dialogs/publish/option');
    this._vis = this.options.vis;
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this._template({
        model: this.model
      })
    );

    this.$el[ this.model.get('disabledBecausePrivate') ? 'addClass' : 'removeClass' ]('is-disabled');

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _initZClipOnce: function(e) {
    this.killEvent(e);

    // ZClip can only be enabled if element is added to the document. The view's $el might not be rendered in DOM yet
    // e.g. if copyable content is still pending to be set from parent.
    if (!this.model.get('copyable') || this.model.get('enabledZClip')) {
      return;
    }
    this.model.set('enabledZClip', true, { silent: true });

    this._inputEl().tipsy({
      trigger: 'manual',
      gravity: 's',
      fade: true,
      title: function() {
        return 'copied!';
      }
    });

    var self = this;
    this._inputEl().zclip({
      path: cdb.config.get('assets_url') + '/flash/ZeroClipboard.swf',
      beforeCopy: function() {
        self._inputEl().focus().select();
      },
      copy: this.model.get('copyable'),
      afterCopy: function() {
        self._inputEl().tipsy('show');
      }
    });
  },

  _hideTipsy: function() {
    this._inputEl().tipsy('hide');
  },

  _inputEl: function() {
    return this.$el.find('input');
  }
});
