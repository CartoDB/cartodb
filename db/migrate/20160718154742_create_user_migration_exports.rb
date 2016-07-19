Sequel.migration do
  change do
    create_table :user_migration_exports do
      Uuid   :id,             primary_key: true, default: 'uuid_generate_v4()'.lit
      String :state,          null: false
      String :exported_file,  null: true, text: true
      String :json_file,      null: true
      DateTime :created_at,   default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at,   default: Sequel::CURRENT_TIMESTAMP

      foreign_key :user_id,         :users,         type: :uuid, null: true, index: true
      foreign_key :organization_id, :organizations, type: :uuid, null: true, index: true
      foreign_key :log_id,          :logs,          type: :uuid, null: false
    end

    create_table :user_migration_imports do
      Uuid   :id,             primary_key: true, default: 'uuid_generate_v4()'.lit
      String :state,          null: false
      String :exported_file,  null: false, text: true
      String :json_file,      null: false
      String :database_host,  null: false
      DateTime :created_at,   default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at,   default: Sequel::CURRENT_TIMESTAMP

      foreign_key :user_id,         :users,         type: :uuid, null: true, index: true
      foreign_key :organization_id, :organizations, type: :uuid, null: true, index: true
      foreign_key :log_id,          :logs,          type: :uuid, null: false
    end
  end
end
