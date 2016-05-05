Sequel.migration do
  up do
    create_table :visualization_exports do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      String :visualization_id, type: 'uuid', null: false
      String :user_id, type: 'uuid', null: false
      String :user_tables_ids, text: true
      String :state, text: true, null: false, default: 'pending'
      String :file, text: true
      String :url, text: true
      String :log_id, type: 'uuid', null: true
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :visualization_exports
  end
end
