require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :rate_limits do
      Uuid        :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
    end
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_anonymous integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_static integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_static_named integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_dataview integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_analysis integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_tile integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_attributes integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named_list integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named_create integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named_get integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named_update integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named_delete integer[]')
    SequelRails.connection.run('ALTER TABLE "rate_limits" ADD COLUMN maps_named_tiles integer[]')
  end,
  Proc.new do
    drop_table :rate_limits
  end
)
