module.exports = {
  analysis: {
    'sql-syntax-error': {
      messageRegex: /^syntax error/
    },
    'invalid-dataset': {
      messageRegex: /relation (.+) does not exist/,
      friendlyMessage: 'Invalid dataset name used. Dataset $0 does not exist.'
    },
    'column-does-not-exist': {
      messageRegex: /column (.+) does not exist/,
      friendlyMessage: 'Invalid column name. Column $0 does not exist.'
    },
    'analysis-requires-authentication': {
      messageRegex: /^Analysis requires authentication with API key/
    }
  },
  generic: {
  },
  limit: {
    'over-platform-limits': {
      messageRegex: /^You are over platform's limits/
    },
    'generic-limit-error': {
      messageRegex: /.*/,
      friendlyMessage: 'The server is taking too long to respond, due to poor conectivity or a temporary error with our servers. Please try again soon.'
    }
  },
  tile: {
    'generic-tile-error': {
      messageRegex: /.*/,
      friendlyMessage: 'Some tiles might not be rendering correctly.'
    }
  },
  layer: {
    'column-does-not-exist': {
      messageRegex: /column (.+) does not exist/,
      friendlyMessage: 'Invalid column name. Column $0 does not exist.'
    },
    'unrecognized-rule': {
      messageRegex: /Unrecognized rule: (.+)/,
      friendlyMessage: 'Unrecognized rule "$0"'
    },
    'generic-layer-error': {
      messageRegex: /.*/
    }
  },
  dataview: {
    'formula-does-not-support-operation': {
      messageRegex: /Formula does not support (.+) operation/
    },
    'column-does-not-exist': {
      messageRegex: /column (.+) does not exist/
    },
    'permission-denied': {
      messageRegex: /permission denied for (.+)/
    },
    'wrong-type-column-used-in-time-series': {
      messageRegex: /function date_part\(unknown, (.+)\) does not exist/,
      friendlyMessage: 'Your time series column type is $0. Please use a date type.'
    },
    'invalid-aggregation-value': {
      messageRegex: /Invalid aggregation value. Valid ones: auto, minute, hour, day, week, month, quarter, year, decade, century, millennium/
    }
  },
  auth: {
    'forbidden': {
      messageRegex: /^Forbidden$/,
      friendlyMessage: 'Forbidden. API key does not grant access.'
    }
  }
};
