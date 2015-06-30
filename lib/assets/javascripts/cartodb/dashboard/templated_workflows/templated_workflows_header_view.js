var cdb = require('cartodb.js');

/**
 *  Templated workflows header view
 *
 *  It will manage which content should be displayed
 *  depending the templated workflow chosen
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack',
    'click .js-templates': '_onClickBack'
  },
  
  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/templated_workflows/templated_workflows_header');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({

      })
    );
    return this;
  },

  _initBinds: function() {
    // this.model.bind('change:option', this.render, this);
  },

  _onClickBack: function() {
    // if (this.model.get('option') !== "templates") {
    //   this.model.set('option', 'templates');
    // }
  }

});