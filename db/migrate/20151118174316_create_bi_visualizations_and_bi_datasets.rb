Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :bi_datasets do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      String :import_config, null: false, type: 'json'
      String :state, null: false
      foreign_key :user_id, :users, type: 'uuid', null: false
      String :import_source, null: false
      String :import_credentials, null: false, type: 'json'
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end

    create_table :bi_visualizations do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      String :viz_json, null: false, type: 'json'
      foreign_key :bi_dataset_id, :bi_datasets, type: 'uuid', null: false
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :bi_visualizations
    drop_table :bi_datasets
  end
end
