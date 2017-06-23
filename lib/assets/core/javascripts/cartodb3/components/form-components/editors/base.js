var Backbone = require('backbone');
var $ = require('jquery');
var ESC_KEY_CODE = 27;

Backbone.Form.editors.Base = Backbone.Form.editors.Base.extend({

  applyESCBind: function (callback) {
    this._ESCBindCallback = callback;
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  },

  _onKeyDown: function (ev) {
    var anyModalOpen;
    if (ev.which === ESC_KEY_CODE) {
      anyModalOpen = this._anyModalOpen();
      !anyModalOpen && this._ESCBindCallback();
    }
  },

  applyClickOutsideBind: function (callback) {
    this._clickBindCallback = callback;
    this.$el.attr('data-cid', this.cid);
    document.addEventListener('click', this._onDocumentClick.bind(this));
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);
    var anyModalOpen = this._anyModalOpen();
    if ($el.closest('[data-cid="' + this.cid + '"]').length === 0 && !anyModalOpen) {
      this._clickBindCallback();
    }
  },

  _anyModalOpen: function () {
    var modals = this.options.modals;
    if (!modals) {
      return false;
    }

    return modals.isOpen();
  },

  remove: function () {
    if (this._ESCBindCallback) {
      document.removeEventListener('keydown', this._onKeyDown.bind(this));
    }
    if (this._clickBindCallback) {
      document.removeEventListener('click', this._onDocumentClick.bind(this));
    }
    Backbone.View.prototype.remove.call(this);
  }

});
