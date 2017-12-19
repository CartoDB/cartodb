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
    }
  }
};
