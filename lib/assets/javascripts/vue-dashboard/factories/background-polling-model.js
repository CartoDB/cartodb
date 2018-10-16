import DashboardBackgroundPollingModel from 'dashboard/data/background-polling/dashboard-background-polling-model';

export default function createBackgroundPollingModel (attributes, options) {
  return new DashboardBackgroundPollingModel(attributes, options);
}
