require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :layer_node_styles do
      primary_key :id, type: :uuid, default: 'uuid_generate_v4()'.lit
      foreign_key :layer_id, :layers, type: :uuid, null: false, on_delete: :cascade
      String      :source_id, null: false
      json        :options, null: false
      json        :infowindow, null: false
      json        :tooltip, null: false
      unique      [:layer_id, :source_id]
    end
  end,
  Proc.new do
    drop_table :layer_node_styles
  end
)
