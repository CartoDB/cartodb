const updateFrequency = {
  '6_months': '6 months',
  daily: 'Daily',
  weekly: 'Weekly',
  yearly: 'Yearly',
  quarterly: 'Quarterly',
  monthly: 'Monthly'
};

export function updateFrequencyName (frequencyId) {
  return frequencyId ? updateFrequency[frequencyId] : '-';
}
