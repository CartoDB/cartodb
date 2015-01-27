Sequel.migration do

  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
    create_table :external_sources do
      Uuid      :id,                primary_key: true, null: false, unique: false, default: 'uuid_generate_v4()'.lit
      foreign_key :visualization_id, :visualizations, type: 'text', null: false
      String    :import_url,        null: false
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :external_sources
  end

end
