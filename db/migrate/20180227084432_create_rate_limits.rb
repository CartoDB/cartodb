require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :rate_limits do
      Uuid        :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      column      :maps_anonymous, "integer[]"
      column      :maps_static, "integer[]"
      column      :maps_static_named, "integer[]"
      column      :maps_dataview, "integer[]"
      column      :maps_analysis, "integer[]"
      column      :maps_tile, "integer[]"
      column      :maps_attributes, "integer[]"
      column      :maps_named_list, "integer[]"
      column      :maps_named_create, "integer[]"
      column      :maps_named_get, "integer[]"
      column      :maps_named, "integer[]"
      column      :maps_named_update, "integer[]"
      column      :maps_named_delete, "integer[]"
      column      :maps_named_tiles, "integer[]"
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
    end
  end,
  Proc.new do
    drop_table :rate_limits
  end
)
