var _ = require('underscore');

module.exports = {

  setOptions: function (editor, opts) {
    var validators = [];

    if (opts.schema && opts.schema.validators) {
      validators = validators.concat(opts.schema.validators);
    }

    if (editor.options && editor.options.validators) {
      validators = validators.concat(editor.options.validators);
    }

    editor.validators = validators;

    editor.options = _.extend(
      {},
      _.omit(editor.options, 'validators') || {},
      opts.schema,
      // 'editorAttrs' can appear in schema if it comes from a Backbone form component
      // or in options directly if the component is created without a Backbone form
      opts.schema && opts.schema.editorAttrs || {},
      opts.editorAttrs,
      {
        keyAttr: opts.key
      },
      {
        validators: validators
      },
      _.omit(opts, 'validators')
    );

    if (editor.options.className) {
      editor.$el.addClass(editor.options.className);
    }

    if (editor.options.trackingClass) {
      var trackClasses = editor.options.trackingClass + ' track-' + editor.options.key + editor.options.editorType;
      editor.$el.addClass(trackClasses);
    }
  }
};
