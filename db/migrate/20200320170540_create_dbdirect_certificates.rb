require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :dbdirect_certificates do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, index: true, on_delete: :cascade
      String      :name, null: false
      String      :arn, null: false
      DateTime    :expiration, null: false
      DateTime    :created_at, null: false
    end
  end,
  Proc.new do
    drop_table :dbdirect_certificates
  end
)
