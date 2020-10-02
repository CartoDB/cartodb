Sequel.migration do
  up do
    SequelRails.connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :external_sources do
      Uuid :id, primary_key: true, null: false, unique: false, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :visualization_id, :visualizations, type: 'text', null: false
      String    :import_url,        null: false
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
      Integer   :rows_counted,      null: false
      Integer   :size, null: false
      String    :username
    end

    SequelRails.connection.run('
        ALTER TABLE "external_sources"
        ADD COLUMN geometry_types text[]
    ')

    create_table :external_data_imports do
      Uuid      :id, primary_key: true, null: false, unique: false, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :data_import_id, :data_imports, type: 'uuid', null: false
      foreign_key :external_source_id, :external_sources, type: 'uuid', null: false
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :external_data_imports
    drop_table :external_sources
  end
end
