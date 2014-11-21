// Load when DOM is ready;
$(function(jQuery) {

  var Tables = require('pages/tables');
  var React = require('react');

  var TestModel = Backbone.Model.extend({});
  var model = new TestModel({
    initial: 'Hello world!'
  });

  var root = $('.tables').last();
  React.renderComponent(<Tables model={model} />, root[0]);
  root.attr('class', 'tables active');
  $('.main_loader').hide();

});
