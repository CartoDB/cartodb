var $ = require('jquery');
var _ = require('underscore');
var log = require('cdb.log');
var View = require('cdb/core/view');
var d3 = require('d3');

/**
 * Default widget content view:
 */
module.exports = View.extend({

  className: 'Widget-body',

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig" title="<%- title %>"><%- title %></h3>'+
      '</div>'+
      '<dl class="Widget-info">'+
        '<dt class="Widget-infoItem Widget-textSmaller Widget-textSmaller--upper"><%- itemsCount %> items</dt>'+
      '</dl>'+
    '</div>'+
    '<div class="Widget-content js-content"></div>',

  _PLACEHOLDER: ' ' +
    '<ul class="Widget-list Widget-list--withBorders">' +
      '<li class="Widget-listItem Widget-listItem--withBorders Widget-listItem--fake"></li>' +
    '</ul>',

  initialize: function() {
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var template = _.template(this._TEMPLATE);
    var data = this.model.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      template({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    }

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:data', this.render, this);
  },

  _addPlaceholder: function() {
    if (this._PLACEHOLDER) {
      var placeholderTemplate = _.template(this._PLACEHOLDER);
      this.$('.js-content').append(placeholderTemplate());
    } else {
      log.info('Placeholder template doesn\'t exist');
    }
  },

  _animateValue: function(model, what, className, opts) {
    var self = this;

    var to   = model.get(what);
    var from = model.previous(what) || 0;

    var format = opts.formatter || d3.format('0,000');

    this.$(className).prop('counter', from).stop().animate({ counter: to }, {
      duration: opts.animationSpeed || 500,
      easing: 'swing',
      step: function (i) {
        if (i === isNaN) {
          i = 0;
        }

        if (_.isNumber(i) && !_.isNaN(i)) {
          value = opts.formatter(i);
        } else {
          value = 0;
        }

        var data = _.extend({ value: value }, opts.templateData);
        $(this).text(opts.template(data));
      }
    });
  },


});
