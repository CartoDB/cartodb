var _ = require('underscore');

/**
 *  Generate the value for each type of turbo-carto ramps,
 *  width (size) or color (fill)
 *
 */

function makeColorRamp (props, isTorqueCategory) {
  var attribute = isTorqueCategory ? 'value' : props.attribute;
  var c = ['ramp([' + attribute + ']'];

  if (props.range) {
    if (_.isArray(props.range)) {
      c.push('(' + props.range.join(', ') + ')');
    } else {
      // colorramp name
      c.push(props.range);
      if (props.bins) {
        c.push(props.bins);
      }
    }
  }
  if (props.domain) {
    if (isTorqueCategory) {
      c.push('(' + _.map(props.domain, function (val, i) {
        return i + 1;
      }).join(', ') + ')');
    } else if (props.static) {
      // It comes from an autostyle, so we have to set the categories explicitly
      var parsedDomain = _.filter(props.domain, function (name) {
        return name !== '"Other"';
      });
      c.push('(' + parsedDomain.join(', ') + ')');
    } else {
      c.push('(' +
        _.filter(
          _.map(props.domain, function (val, i) {
            // Maps api converts null or empty value in emtpy string
            // and in the fill component we label them with a locale
            // so we use the same locale to generate the cartocss
            return val === '' ? _t('form-components.editors.fill.input-categories.null') : val;
          }),
          function (val) {
            return !_.isUndefined(val);
          }).join(', ') +
        ')'
      );
      c.push('"="');
    }
  }
  if (props.quantification) {
    c.push(props.quantification.toLowerCase());
  }

  if (isTorqueCategory) {
    c.push('"="');
  }

  return c.join(', ') + ')';
}

function makeWidthRamp (props) {
  var c = ['ramp([' + props.attribute + ']'];

  if (props.range) {
    var min = props.range[0];
    var max = props.range[1];

    c.push('range(' + min + ', ' + max + ')');
  }

  if (props.quantification) {
    var quantification = props.quantification.toLowerCase();

    if (props.bins) {
      c.push(quantification + '(' + props.bins + ')');
    } else {
      c.push(quantification);
    }
  }

  return c.join(', ') + ')';
}

module.exports = {
  generateColorRamp: makeColorRamp,
  generateWidthRamp: makeWidthRamp
};
