require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :email_verification_token, String, null: true
    add_column :users, :email_verification_sent_at, DateTime, null: true
  end,
  Proc.new do
    drop_column :users, :email_verification_token
    drop_column :users, :email_verification_sent_at
  end
)
