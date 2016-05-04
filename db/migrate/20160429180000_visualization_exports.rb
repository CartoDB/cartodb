Sequel.migration do
  up do
    create_table :visualization_exports do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      foreign_key :visualization_id, :visualizations, type: 'uuid', null: false, on_delete: :cascade
      foreign_key :user_id, :users, type: 'uuid', null: false, on_delete: :cascade
      String :user_tables_ids, text: true
      String :state, text: true, null: false, default: Carto::VisualizationExport::STATE_PENDING
      String :file, text: true
      String :url, text: true
      foreign_key :log_id, :logs, type: 'uuid', null: true, on_delete: :cascade
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :visualization_exports
  end
end
