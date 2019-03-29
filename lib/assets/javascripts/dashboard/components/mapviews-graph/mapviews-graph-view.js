const _ = require('underscore');
const $ = require('jquery');
const d3 = require('d3');
const moment = require('moment');
const CoreView = require('backbone/core-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
const Utils = require('builder/helpers/utils');

/**
 *  Visualization mapviews graph
 *
 */

module.exports = CoreView.extend({

  options: {
    stats: [],
    width: 127,
    height: 22
  },

  initialize: function () {
    this.options.stats = _.map(
      this.options.stats,
      (val, date) => ({
        mapviews: val,
        when: date,
        today: moment(new Date(date)).format('DD/MM/YYYY') === moment(new Date()).format('DD/MM/YYYY')
      })
    );
  },

  render: function () {
    const self = this;

    const width = this.options.width;
    const height = this.options.height;
    const data = this.options.stats;
    const minHeight = 2;

    const x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
    const y = d3.scale.linear().range([height, 0]);
    const xAxis = d3.svg.axis().scale(x).orient('bottom');

    const svg = d3.select(this.$el[0]).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g');

    x.domain(data.map(d => d.when));
    y.domain([0, d3.max(data, d => d.mapviews)]);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'MapviewsGraph-bar')
      .attr('data-tooltip', function (d) {
        return Utils.formatNumber(d.mapviews) + ' ' + pluralizeString('mapview', d.mapviews) + (d.today ? (' today') : (' on ' + d.when));
      })
      .attr('x', function (d) { return x(d.when); })
      .attr('width', 3)
      .attr('y', function (d) {
        const value = height - y(d.mapviews);
        const yPos = y(d.mapviews);
        return value < minHeight ? (height - minHeight) : yPos;
      })
      .attr('height', function (d) {
        const value = height - y(d.mapviews);
        return value < minHeight ? minHeight : value;
      })
      .on('mouseover', function (d) {
        if (d.mapviews > 0) {
          const element = this;
          const $element = $(element);
          self.addView(
            new TipsyTooltipView({
              el: element,
              className: 'MapviewsGraph-tooltip',
              html: true,
              trigger: 'manual'
            })
          );
          $element.tipsy('show');
        }
      })
      .on('mouseout', function (d) {
        if (d.mapviews > 0) {
          const $el = $(this);
          // Eliminating tipsy thing from the single graph bar
          $el.tipsy('hide');
          $el.unbind('mouseleave mouseenter');
        }
      });

    return this;
  }

});
