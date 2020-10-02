require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    create_table :layer_node_styles do
      primary_key :id, type: :uuid, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :layer_id, :layers, type: :uuid, null: false, on_delete: :cascade
      String      :source_id, null: false
      json        :options, null: false
      json        :infowindow, null: false
      json        :tooltip, null: false
      unique      [:layer_id, :source_id]
    end
  end,
  proc do
    drop_table :layer_node_styles
  end
)
