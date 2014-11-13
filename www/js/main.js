App.Views.Index = Backbone.View.extend({
  el: document.body,

  initialize: function() {
    this._initViews();
  },

  _initViews: function() {
    console.log('Hola matata');
  }
});


$(function() {
  window.index = new App.Views.Index();
});
