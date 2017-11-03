# encoding: utf-8

Sequel.migration do

  up do

    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    alter_table :organizations do
      add_column :default_quota_in_bytes, :bigint
    end

    SequelRails.connection.run(%q{
      ALTER TABLE "organizations"
      ADD COLUMN whitelisted_email_domains text[] NOT NULL DEFAULT ARRAY[]::text[]
    })

    alter_table :users do
      add_column :enable_account_token, String
    end

    # INFO: we're not adding FKs because this is for monitoring and log purposes
    create_table :user_creations do
      Uuid      :id,                primary_key: true, default: 'uuid_generate_v4()'.lit
      String    :username,          null: false
      String    :email,             null: false
      String    :crypted_password,  null: false
      String    :salt,              null: false
      Uuid      :organization_id
      Boolean   :google_sign_in,    default: false
      Bigint    :quota_in_bytes
      String    :state
      Uuid      :log_id
      Uuid      :user_id
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end

    alter_table :user_creations do
      add_index [:username]
    end
  end

  down do
    drop_table :user_creations

    alter_table :users do
      drop_column :enable_account_token
    end

    alter_table :organizations do
      drop_column :whitelisted_email_domains
      drop_column :default_quota_in_bytes
    end
  end

end
