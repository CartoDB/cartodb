var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  schema: {
    color: {
      type: 'Fill',
      title: 'Fill',
      options: [],
      editorAttrs: {
        color: {
          hidePanes: ['value']
        }
      }
    },
    name: {
      type: 'Text'
    }
  }
});
