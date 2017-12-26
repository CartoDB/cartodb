require_relative '../../app/models/carto/visualization_export'

FactoryGirl.define do
  factory :visualization_export, class: Carto::VisualizationExport do
    id { UUIDTools::UUID.timestamp_create.to_s }
    state Carto::VisualizationExport::STATE_PENDING
    file { "#{Cartodb.get_config(:exporter, "uploads_path")}/abcd/Untitled Map (on 2016-05-26 at 06.08.15).carto" }
    url { "/api/v3/visualization_exports/#{id}/download" }
    created_at { Time.now }
    updated_at { Time.now }
  end
end
