require_relative '../../app/models/carto/visualization_export'

FactoryGirl.define do
  factory :visualization_export, class: Carto::VisualizationExport do
    state Carto::VisualizationExport::STATE_PENDING
    created_at { Time.now }
    updated_at { Time.now }
  end
end
