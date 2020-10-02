Sequel.migration do
  up do
    SequelRails.connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :organizations do
      Uuid :id, primary_key: true, null: false, unique: false, default: Sequel.lit('uuid_generate_v4()')
      Integer :seats
      Integer :quota_in_bytes
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :organizations
  end
end
