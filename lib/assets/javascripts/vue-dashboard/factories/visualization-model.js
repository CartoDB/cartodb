import VisualizationModel from 'dashboard/data/visualization-model';

export default function createVisModel (attributes, options) {
  return new VisualizationModel(attributes, options);
}
