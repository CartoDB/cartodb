Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :permissions do
      Uuid        :id,                  primary_key: true, null: false, unique: false, default: Sequel.lit('uuid_generate_v4()')
      Uuid        :owner_id,            null: false
      Text        :owner_username,      null: false
      Text        :access_control_list, null: false, default: '[]'
      DateTime    :created_at,          default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,          default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :permissions
  end
end
