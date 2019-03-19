Sequel.migration do
  change do
    create_table :user_migration_exports do
      Uuid     :id,            primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      String   :state,         null: false
      String   :exported_file, null: true, text: true
      String   :json_file,     null: true
      DateTime :created_at,    default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at,    default: Sequel::CURRENT_TIMESTAMP

      foreign_key :user_id,         :users,         type: :uuid, null: true, on_delete: :cascade
      foreign_key :organization_id, :organizations, type: :uuid, null: true, on_delete: :cascade
      foreign_key :log_id,          :logs,          type: :uuid, null: false
    end

    create_table :user_migration_imports do
      Uuid     :id,            primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      String   :state,         null: false
      String   :exported_file, null: false, text: true
      String   :json_file,     null: false
      String   :database_host, null: false
      Boolean  :org_import,    null: false
      DateTime :created_at,    default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at,    default: Sequel::CURRENT_TIMESTAMP

      foreign_key :user_id,         :users,         type: :uuid, null: true, on_delete: :cascade
      foreign_key :organization_id, :organizations, type: :uuid, null: true, on_delete: :cascade
      foreign_key :log_id,          :logs,          type: :uuid, null: false
    end
  end
end
