require_relative '../../app/models/carto/visualization_export'

FactoryGirl.define do
  factory :visualization_export, class: Carto::VisualizationExport do
    id { UUIDTools::UUID.timestamp_create.to_s }
    state Carto::VisualizationExport::STATE_PENDING
    file { "#{Cartodb.get_config(:exporter, "uploads_path")}/0212c2081a3159e9a4a0/Untitled Map (on 2016-05-26 at 06.08.15).carto" }
    url { "/api/v3/visualization_exports/#{id}/download/0212c2081a3159e9a4a0/Untitled Map (on 2016-05-26 at 06.08.15).carto" }
    created_at { Time.now }
    updated_at { Time.now }
  end
end
