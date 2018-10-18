var EditorBaseView = require('./editor-base-view');
var ENTER_KEY_CODE = 13;

module.exports = EditorBaseView.extend({

  tagName: 'textarea',
  className: 'Table-editorTextarea CDB-Textarea CDB-Text',

  _onKeyPressed: function (ev) {
    if (!ev.shiftKey && ev.which === ENTER_KEY_CODE) {
      this._onValueChange();
      this._editorModel.confirm();
    }
  }

});
