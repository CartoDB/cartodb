require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    drop_table :automatic_geocodings
    drop_column :geocodings, :automatic_geocoding_id
  end,
  Proc.new do
    create_table :automatic_geocodings do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      Integer     :table_id
      Text        :state
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
      DateTime    :ran_at
      Integer     :retried_times
    end
    add_column :geocodings, :automatic_geocoding_id, :integer
  end
)
