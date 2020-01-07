var _ = require('underscore');
var Backbone = require('backbone');
var FactoryHints = require('builder/editor/editor-hints/factory-hints');

describe('components/code-mirror/code-editor', function () {
  var view;

  beforeEach(function () {
    view = new Backbone.Form.editors.CodeEditor({
      className: 'className',
      key: 'key',
      model: new Backbone.Model(),
      schema: {}
    });
  });

  it('should render properly', function () {
    spyOn(view, '_initViews');
    view.render();
    expect(view._initViews).toHaveBeenCalled();
  });

  it('should create CodeMirrorView with required properties', function () {
    view._codemirrorModel = new Backbone.Model({
      content: '',
      readonly: false,
      lineNumbers: false
    });

    FactoryHints.init({
      tokens: '',
      tableName: false,
      columnsName: false
    });

    view._initViews();
    var props = [
      'model',
      '_placeholder',
      '_tips'
    ];

    props.forEach(function (prop) {
      expect(_.has(view.codeMirrorView, prop)).toBeTruthy();
    });
  });
});
