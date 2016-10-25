require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :layer_node_styles do
      primary_key :id, type: :uuid, default: 'uuid_generate_v4()'.lit
      foreign_key :layer_id, :layers, type: :uuid
      String      :source_id
      json        :options
      json        :infowindow
      json        :tooltip
    end
  end,
  Proc.new do
    drop_table :layer_node_styles
  end
)
