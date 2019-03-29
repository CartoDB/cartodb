var EditorBaseView = require('./editor-base-view');
var $ = require('jquery');
var template = require('./editor-boolean.tpl');

module.exports = EditorBaseView.extend({

  tagName: 'div',
  className: 'u-flex',

  events: {
    'change input:radio': '_onRadioChanged'
  },

  render: function () {
    var value = this.model.get('value');
    this.$el.html(
      template({
        value: value !== null ? value.toString() : 'null'
      })
    );
    return this;
  },

  _onRadioChanged: function (ev) {
    var value = $(ev.target).val();
    switch (value) {
      case 'true':
        value = true;
        break;
      case 'false':
        value = false;
        break;
      default:
        value = null;
    }
    this.model.set('value', value);
    this._editorModel.confirm();
  }

});
