var StyleFormAggregationDataset = require('builder/editor/style/style-form/style-form-dictionary/aggregation-dataset');
var StyleFormAggregationSize = require('builder/editor/style/style-form/style-form-dictionary/aggregation-size');
var StyleFormAggregationValue = require('builder/editor/style/style-form/style-form-dictionary/aggregation-value');
var StyleFormAnimatedAttribute = require('builder/editor/style/style-form/style-form-dictionary/animated-attribute');
var StyleFormAnimatedDuration = require('builder/editor/style/style-form/style-form-dictionary/animated-duration');
var StyleFormAnimatedOverlap = require('builder/editor/style/style-form/style-form-dictionary/animated-overlap');
var StyleFormAnimatedResolution = require('builder/editor/style/style-form/style-form-dictionary/animated-resolution');
var StyleFormAnimatedSteps = require('builder/editor/style/style-form/style-form-dictionary/animated-steps');
var StyleFormAnimatedTrails = require('builder/editor/style/style-form/style-form-dictionary/animated-trails');
var StyleFormBlending = require('builder/editor/style/style-form/style-form-dictionary/blending');
var StyleFormFillColor = require('builder/editor/style/style-form/style-form-dictionary/fill-color');
var StyleFormFillSize = require('builder/editor/style/style-form/style-form-dictionary/fill-size');
var StyleFormFill = require('builder/editor/style/style-form/style-form-dictionary/fill');
var StyleFormLabelsAttribute = require('builder/editor/style/style-form/style-form-dictionary/labels-attribute');
var StyleFormLabelsFill = require('builder/editor/style/style-form/style-form-dictionary/labels-fill');
var StyleFormLabelsFont = require('builder/editor/style/style-form/style-form-dictionary/labels-font');
var StyleFormLabelsHalo = require('builder/editor/style/style-form/style-form-dictionary/labels-halo');
var StyleFormLabelsOffset = require('builder/editor/style/style-form/style-form-dictionary/labels-offset');
var StyleFormLabelsOverlap = require('builder/editor/style/style-form/style-form-dictionary/labels-overlap');
var StyleFormLabelsPlacement = require('builder/editor/style/style-form/style-form-dictionary/labels-placement');
var StyleFormStrokeSize = require('builder/editor/style/style-form/style-form-dictionary/stroke-size');
var StyleFormStroke = require('builder/editor/style/style-form/style-form-dictionary/stroke');
var StyleFormStyle = require('builder/editor/style/style-form/style-form-dictionary/style');
var StyleFormHidden = require('builder/editor/style/style-form/style-form-dictionary/hidden');

/*
 *  Dictionary that contains all the necessary components
 *  for the styles form
 */

module.exports = {
  'aggregation-dataset': function (params) {
    return StyleFormAggregationDataset.generate(params);
  },

  'aggregation-size': function (params) {
    return StyleFormAggregationSize.generate(params);
  },

  'aggregation-value': function (params) {
    return StyleFormAggregationValue.generate(params);
  },

  'animated-attribute': function (params) {
    return StyleFormAnimatedAttribute.generate(params);
  },

  'animated-enabled': function (params) {
    return StyleFormHidden.generate(params);
  },

  'animated-duration': function (params) {
    return StyleFormAnimatedDuration.generate(params);
  },

  'animated-overlap': function (params) {
    return StyleFormAnimatedOverlap.generate(params);
  },

  'animated-resolution': function (params) {
    return StyleFormAnimatedResolution.generate(params);
  },

  'animated-steps': function (params) {
    return StyleFormAnimatedSteps.generate(params);
  },

  'animated-trails': function (params) {
    return StyleFormAnimatedTrails.generate(params);
  },

  'blending': function (params) {
    return StyleFormBlending.generate(params);
  },

  'fillColor': function (params) {
    return StyleFormFillColor.generate(params);
  },

  'fillSize': function (params) {
    return StyleFormFillSize.generate(params);
  },

  'fill': function (params) {
    return StyleFormFill.generate(params);
  },

  'labels-attribute': function (params) {
    return StyleFormLabelsAttribute.generate(params);
  },

  'labels-enabled': function (params) {
    return StyleFormHidden.generate(params);
  },

  'labels-fill': function (params) {
    return StyleFormLabelsFill.generate(params);
  },

  'labels-font': function (params) {
    return StyleFormLabelsFont.generate(params);
  },

  'labels-halo': function (params) {
    return StyleFormLabelsHalo.generate(params);
  },

  'labels-offset': function (params) {
    return StyleFormLabelsOffset.generate(params);
  },

  'labels-overlap': function (params) {
    return StyleFormLabelsOverlap.generate(params);
  },

  'labels-placement': function (params) {
    return StyleFormLabelsPlacement.generate(params);
  },

  'strokeSize': function (params) {
    return StyleFormStrokeSize.generate(params);
  },

  'stroke': function (params) {
    return StyleFormStroke.generate(params);
  },

  'style': function (params) {
    return StyleFormStyle.generate(params);
  }
};
