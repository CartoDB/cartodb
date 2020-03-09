require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :rate_limits do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      column      :maps_anonymous, "integer[]"
      column      :maps_static, "integer[]"
      column      :maps_static_named, "integer[]"
      column      :maps_dataview, "integer[]"
      column      :maps_dataview_search, "integer[]"
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
      column      :sql_query, "integer[]"
      column      :sql_query_format, "integer[]"
      column      :sql_job_create, "integer[]"
      column      :sql_job_get, "integer[]"
      column      :sql_job_delete, "integer[]"
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end
  end,
  Proc.new do
    drop_table :rate_limits
  end
)
