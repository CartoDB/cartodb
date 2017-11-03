Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
    create_table :search_tweets do
      Uuid      :id,                primary_key: true, null: false, unique: false, default: 'uuid_generate_v4()'.lit
      Uuid      :user_id,           null: false
      Uuid      :table_id,          null: true
      Uuid      :data_import_id,    null: false
      Text      :service_item_id,   null: false
      Integer   :retrieved_items,   null: false, default: 0
      Text      :state,             null: false
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end
  end
  down do
    drop_table :search_tweets
  end
end
