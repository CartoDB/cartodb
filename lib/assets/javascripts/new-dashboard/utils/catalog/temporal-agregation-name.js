const temporalAggregations = {
  '3yrs': '3 years',
  '5yrs': '5 years',
  daily: 'Daily',
  weekly: 'Weekly',
  yearly: 'Yearly',
  quarterly: 'Quarterly',
  hourly: 'Hourly',
  seconds: 'Seconds',
  monthly: 'Monthly',
  '5minutes': 'Minutes'
};

export function temporalAggregationName (aggregationId) {
  return temporalAggregations[aggregationId];
}
