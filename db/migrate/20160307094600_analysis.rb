Sequel.migration do
  up do
    create_table :analyses do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      foreign_key :visualization_id, :visualizations, type: 'uuid', null: false, on_delete: :cascade
      foreign_key :user_id, :users, type: 'uuid', null: false, on_delete: :cascade
      String :params, null: false, type: 'json'
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end

    add_index :analyses, :visualization_id

    Rails::Sequel.connection.run(%{
      create index analysis_params_id on analyses ((params->>'id'))
    })
  end

  down do
    drop_table :analyses
  end
end
