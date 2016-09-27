Sequel.migration do
  up do
    create_table :connector_providers do
      Uuid     :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
      String   :name, null: false
    end

    alter_table :connector_providers do
      add_index :name
    end

    create_table :connector_configurations do
      Uuid     :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
      Boolean  :enabled, null: false
      Integer  :max_rows, null: true

      foreign_key :user_id, :users, type: :uuid, null: true, on_delete: :cascade
      foreign_key :organization_id, :organizations, type: :uuid, null: true, on_delete: :cascade
      foreign_key :connector_provider_id, :connector_providers, type: :uuid, null: false, on_delete: :restrict
    end

    alter_table :connector_configurations do
      add_index :user_id
      add_index :organization_id
      add_index :connector_provider_id
    end
  end

  down do
    drop_table :connector_configurations
    drop_table :connector_providers
  end
end
