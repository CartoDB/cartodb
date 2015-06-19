Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    # INFO: we're not adding FKs because this is for monitoring and log purposes
    create_table :user_creations do
      Uuid      :id,                primary_key: true, default: 'uuid_generate_v4()'.lit
      String    :username,          null: false
      String    :email,             null: false
      String    :crypted_password,  null: false
      String    :salt,              null: false
      Uuid      :organization_id
      Boolean   :google_sign_in,    default: false
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
  end
end
