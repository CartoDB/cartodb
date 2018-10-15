import ConfigModel from 'dashboard/data/config-model';

export default function createConfigModel (properties) {
  return new ConfigModel(properties);
}
