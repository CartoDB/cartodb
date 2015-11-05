var _ = require('underscore');
var Template = require('../../core/template');
var Model = require('../../core/model');
var View = require('../../core/view');
var SlidesControllerItem = require('./slides-controller-item');

var SlidesController = View.extend({

  defaults: {
    show_counter: false
  },

  events: {
    'click a.next': "_next",
    'click a.prev': "_prev"
  },

  tagName: "div",

  className: "cartodb-slides-controller",

  template: Template.compile("<div class='slides-controller-content'><a href='#' class='prev'></a><% if (show_counter) {%><div class='counter'></div><% } else { %><ul></ul><% } %><a href='#' class='next'></a></div>"),

  initialize: function() {
    this.slidesCount = this.options.transitions.length;
    this.visualization = this.options.visualization;
    this.slides = this.visualization.slides;
  },

  _prev: function(e) {
    if (e) this.killEvent(e);
    this.visualization.sequence.prev();
  },

  _next: function(e) {
    if (e) this.killEvent(e);
    this.visualization.sequence.next();
  },

  _renderDots: function() {

    var currentActiveSlide = this.slides.state();

    for (var i = 0; i < this.options.transitions.length; i++) {
      var item = new SlidesControllerItem({ num: i, transition_options: this.options.transitions[i], active: i == currentActiveSlide });
      item.bind("onClick", this._onSlideClick, this);
      this.$el.find("ul").append(item.render().$el);
    }

  },

  _renderCounter: function() {

    var currentActiveSlide = this.slides.state();
    var currentTransition = this.options.transitions[currentActiveSlide];

    var $counter = this.$el.find(".counter");

    if (currentTransition && currentTransition.transition_trigger === "time") {
      $counter.addClass("loading");
    } else {
      $counter.removeClass("loading");
    }

    $counter.html((currentActiveSlide + 1) + "/" + this.options.transitions.length)
  },

  _onSlideClick: function(slide) {
    this.visualization.sequence.current(slide.options.num);
  },

  render: function() {

    var options = _.extend(this.defaults, this.options);

    this.$el.html(this.template(options));

    if (this.slides && this.options.transitions) {

      if (options.show_counter) {
        this._renderCounter(); // we render: 1/N
      } else {
        this._renderDots(); // we render a list of dots
      }

    }

    return this;
  }

});

module.exports = SlidesController;
