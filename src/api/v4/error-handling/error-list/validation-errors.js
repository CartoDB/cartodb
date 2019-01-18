module.exports = {
  layer: {
    'non-valid-source': {
      messageRegex: /nonValidSource/,
      friendlyMessage: 'The given object is not a valid source. See "carto.source.Base".'
    },
    'non-valid-style': {
      messageRegex: /nonValidStyle/,
      friendlyMessage: 'The given object is not a valid style. See "carto.style.Base".'
    },
    'non-valid-columns': {
      messageRegex: /nonValidColumns/,
      friendlyMessage: 'The given object is not a valid array of string columns.'
    },
    'source-with-different-client': {
      messageRegex: /differentSourceClient/,
      friendlyMessage: "A layer can't have a source which belongs to a different client."
    },
    'style-with-different-client': {
      messageRegex: /differentStyleClient/,
      friendlyMessage: "A layer can't have a style which belongs to a different client."
    },
    'wrong-interactivity-columns': {
      messageRegex: /wrongInteractivityColumns\[(.+)\]#(.+)$/,
      friendlyMessage: 'Columns [$0] set on `$1` do not match the columns set in aggregation options.'
    }
  },
  source: {
    'query-required': {
      messageRegex: /requiredQuery/,
      friendlyMessage: 'SQL Source must have a SQL query.'
    },
    'query-string': {
      messageRegex: /requiredString/,
      friendlyMessage: 'SQL Query must be a string.'
    },
    'no-dataset-name': {
      messageRegex: /noDatasetName/,
      friendlyMessage: 'Table name is required.'
    },
    'dataset-string': {
      messageRegex: /requiredDatasetString$/,
      friendlyMessage: 'Table name must be a string.'
    },
    'dataset-required': {
      messageRegex: /requiredDataset$/,
      friendlyMessage: 'Table name must be not empty.'
    }
  },
  style: {
    'required-css': {
      messageRegex: /requiredCSS$/,
      friendlyMessage: 'CartoCSS is required.'
    },
    'css-string': {
      messageRegex: /requiredCSSString$/,
      friendlyMessage: 'CartoCSS must be a string.'
    }
  },
  client: {
    'bad-layer-type': {
      messageRegex: /badLayerType/,
      friendlyMessage: 'The given object is not a layer.'
    },
    'index-number': {
      messageRegex: /indexNumber/,
      friendlyMessage: 'index property must be a number.'
    },
    'index-out-of-range': {
      messageRegex: /indexOutOfRange/,
      friendlyMessage: 'index is out of range.'
    },
    'api-key-required': {
      messageRegex: /apiKeyRequired/,
      friendlyMessage: 'apiKey property is required.'
    },
    'api-key-string': {
      messageRegex: /apiKeyString/,
      friendlyMessage: 'apiKey property must be a string.'
    },
    'username-required': {
      messageRegex: /usernameRequired/,
      friendlyMessage: 'username property is required.'
    },
    'username-string': {
      messageRegex: /usernameString/,
      friendlyMessage: 'username property must be a string.'
    },
    'non-valid-server-url': {
      messageRegex: /nonValidServerURL/,
      friendlyMessage: 'serverUrl is not a valid URL.'
    },
    'non-matching-server-url': {
      messageRegex: /serverURLDoesntMatchUsername/,
      friendlyMessage: "serverUrl doesn't match the username."
    },
    'duplicated-layer-id': {
      messageRegex: /duplicatedLayerId/,
      friendlyMessage: 'A layer with the same ID already exists in the client.'
    }
  },
  dataview: {
    'source-required': {
      messageRegex: /sourceRequired/,
      friendlyMessage: 'Source property is required.'
    },
    'column-required': {
      messageRegex: /columnRequired/,
      friendlyMessage: 'Column property is required.'
    },
    'column-string': {
      messageRegex: /columnString/,
      friendlyMessage: 'Column property must be a string.'
    },
    'empty-column': {
      messageRegex: /emptyColumn/,
      friendlyMessage: 'Column property must be not empty.'
    },
    'filter-required': {
      messageRegex: /filterRequired/,
      friendlyMessage: 'Filter property is required.'
    },
    'time-series-options-required': {
      messageRegex: /timeSeriesOptionsRequired/,
      friendlyMessage: 'Options object to create a time series dataview is required.'
    },
    'time-series-invalid-aggregation': {
      messageRegex: /timeSeriesInvalidAggregation/,
      friendlyMessage: 'Time aggregation must be a valid value. Use carto.dataview.timeAggregation.'
    },
    'time-series-invalid-offset': {
      messageRegex: /timeSeriesInvalidOffset/,
      friendlyMessage: 'Offset must an integer value between -12 and 14.'
    },
    'time-series-invalid-uselocaltimezone': {
      messageRegex: /timeSeriesInvalidUselocaltimezone/,
      friendlyMessage: 'useLocalTimezone must be a boolean value.'
    },
    'histogram-options-required': {
      messageRegex: /histogramOptionsRequired/,
      friendlyMessage: 'Options object to create a histogram dataview is required.'
    },
    'histogram-invalid-bins': {
      messageRegex: /histogramInvalidBins/,
      friendlyMessage: 'Bins must be a positive integer value.'
    },
    'histogram-invalid-start-end': {
      messageRegex: /histogramInvalidStartEnd/,
      friendlyMessage: 'Both start and end values must be a number or null.'
    },
    'formula-options-required': {
      messageRegex: /formulaOptionsRequired/,
      friendlyMessage: 'Formula dataview options are not defined.'
    },
    'formula-invalid-operation': {
      messageRegex: /formulaInvalidOperation/,
      friendlyMessage: 'Operation for formula dataview is not valid. Use carto.operation'
    },
    'category-options-required': {
      messageRegex: /categoryOptionsRequired/,
      friendlyMessage: 'Category dataview options are not defined.'
    },
    'category-limit-required': {
      messageRegex: /categoryLimitRequired/,
      friendlyMessage: 'Limit for category dataview is required.'
    },
    'category-limit-number': {
      messageRegex: /categoryLimitNumber/,
      friendlyMessage: 'Limit for category dataview must be a number.'
    },
    'category-limit-positive': {
      messageRegex: /categoryLimitPositive/,
      friendlyMessage: 'Limit for category dataview must be greater than 0.'
    },
    'category-invalid-operation': {
      messageRegex: /categoryInvalidOperation/,
      friendlyMessage: 'Operation for category dataview is not valid. Use carto.operation'
    },
    'category-operation-required': {
      messageRegex: /categoryOperationRequired/,
      friendlyMessage: 'Operation column for category dataview is required.'
    },
    'category-operation-string': {
      messageRegex: /categoryOperationString/,
      friendlyMessage: 'Operation column for category dataview must be a string.'
    },
    'category-operation-empty': {
      messageRegex: /categoryOperationEmpty/,
      friendlyMessage: 'Operation column for category dataview must be not empty.'
    }
  },
  filter: {
    'invalid-bounds-object': {
      messageRegex: /invalidBoundsObject/,
      friendlyMessage: 'Bounds object is not valid. Use a carto.filter.Bounds object'
    },
    'column-required': {
      messageRegex: /columnRequired/,
      friendlyMessage: 'Column property is required.'
    },
    'column-string': {
      messageRegex: /columnString/,
      friendlyMessage: 'Column property must be a string.'
    },
    'empty-column': {
      messageRegex: /emptyColumn/,
      friendlyMessage: 'Column property must be not empty.'
    },
    'invalid-filter': {
      messageRegex: /invalidFilter(.+)/,
      friendlyMessage: "'$0' is not a valid filter. Please check documentation."
    },
    'invalid-option': {
      messageRegex: /invalidOption(.+)/,
      friendlyMessage: "'$0' is not a valid option for this filter."
    },
    'wrong-filter-type': {
      messageRegex: /wrongFilterType/,
      friendlyMessage: 'Filters need to extend from carto.filter.SQLBase. Please use carto.filter.Category or carto.filter.Range.'
    },
    'invalid-parameter-type': {
      messageRegex: /invalidParameterType(.+)/,
      friendlyMessage: "Invalid parameter type for '$0'. Please check filters documentation."
    }
  },
  aggregation: {
    'threshold-required': {
      messageRegex: /thresholdRequired/,
      friendlyMessage: 'Aggregation threshold is required.'
    },
    'invalid-threshold': {
      messageRegex: /invalidThreshold/,
      friendlyMessage: 'Aggregation threshold must be an integer value greater than 0.'
    },
    'resolution-required': {
      messageRegex: /resolutionRequired/,
      friendlyMessage: 'Aggregation resolution is required.'
    },
    'invalid-resolution': {
      messageRegex: /invalidResolution/,
      friendlyMessage: 'Aggregation resolution must be 0.5, 1 or powers of 2 up to 256 (2, 4, 8, 16, 32, 64, 128, 256).'
    },
    'invalid-placement': {
      messageRegex: /invalidPlacement/,
      friendlyMessage: 'Aggregation placement is not valid. Must be one of these values: `point-sample`, `point-grid`, `centroid`'
    },
    'column-function-required': {
      messageRegex: /columnFunctionRequired(.+)$/,
      friendlyMessage: "Aggregation function for column '$0' is required."
    },
    'invalid-column-function': {
      messageRegex: /invalidColumnFunction(.+)$/,
      friendlyMessage: "Aggregation function for column '$0' is not valid. Use carto.aggregation.function"
    },
    'column-aggregated-column-required': {
      messageRegex: /columnAggregatedColumnRequired(.+)$/,
      friendlyMessage: "Column to be aggregated to '$0' is required."
    },
    'invalid-column-aggregated-column': {
      messageRegex: /invalidColumnAggregatedColumn(.+)$/,
      friendlyMessage: "Column to be aggregated to '$0' must be a string."
    }
  }
};
