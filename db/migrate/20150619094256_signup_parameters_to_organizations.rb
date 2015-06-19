# encoding: utf-8

Sequel.migration do

  up do
    alter_table :organizations do
      add_column :default_quota_in_bytes, :bigint
      add_column :signup_page_enabled, :boolean, default: false
    end
    Rails::Sequel.connection.run(%q{
      ALTER TABLE "organizations"
      ADD COLUMN whitelisted_email_domains text[]
    })
  end

  down do
    alter_table :organizations do
      drop_column :whitelisted_email_domains
      drop_column :signup_page_enabled
      drop_column :default_quota_in_bytes
    end
  end
end
