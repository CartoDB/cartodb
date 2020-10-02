require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    drop_table :oauth_nonces
  end,
  proc do
    create_table :oauth_nonces do
      Uuid :id, primary_key: true
      String :nonce
      Integer :timestamp
      DateTime :created_at, null: false
      DateTime :updated_at, null: false
      index [:nonce, :timestamp], unique: true
    end
  end
)
