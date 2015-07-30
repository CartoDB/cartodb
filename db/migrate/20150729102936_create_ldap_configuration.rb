Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :ldap_configurations do
      Uuid      :id,                primary_key: true, default: 'uuid_generate_v4()'.lit
      foreign_key :organization_id, :organizations, type: 'uuid', null: false
      String    :host,              null: false
      Integer   :port,              null: false
      String    :encryption
      String    :ca_file # Certificate file for start_tls encryption. Example: "/etc/cafile.pem"
      String    :ssl_version # For start_tls_encryption. Example: "TLSv1_1"
      String    :connection_user,   null: false
      String    :connection_password,     null: false
      String    :user_id_field,     null: false
      String    :username_field
      String    :email_field,       null: false
      String    :domain_bases,      type: 'text[]'
      String    :user_object_class,  null: false
      String    :group_object_class, null: false
      # This configuration is not confirmed
      # String    :user_groups,       type: 'text[]'
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end

  end

  down do
    drop_table :ldap_configurations
  end
end
