var _ = require('underscore');

module.exports = {

  setOptions: function (editor, options) {
    var validators = [];

    if (options.schema && options.schema.validators) {
      validators = validators.concat(options.schema.validators);
    }

    if (editor.options && editor.options.validators) {
      validators = validators.concat(editor.options.validators);
    }

    editor.validators = validators;
    editor.options = this._getEditorOptions(editor, options, validators);

    if (editor.options.className) {
      editor.$el.addClass(editor.options.className);
    }

    if (editor.options.trackingClass) {
      var trackClasses = editor.options.trackingClass + ' track-' + editor.options.key + editor.options.editorType;
      editor.$el.addClass(trackClasses);
    }
  },

  _editorAttrsFromBackboneFormSchema: function (options) {
    return options.schema && options.schema.editorAttrs || {};
  },

  _getEditorOptions: function (editor, options, validators) {
    var editorOptions = _.omit(editor.options, 'validators') || {};
    var schema = options.schema;
    var backboneFormSchema = this._editorAttrsFromBackboneFormSchema(options);
    var editorAttrs = options.editorAttrs;
    var optionKey = { keyAttr: options.key };
    var optionValidators = { validators: validators };
    var defaultOptions = _.omit(options, 'validators');

    return _.extend(
      {},
      editorOptions,
      schema,
      backboneFormSchema,
      editorAttrs,
      optionKey,
      optionValidators,
      defaultOptions
    );
  }
};
