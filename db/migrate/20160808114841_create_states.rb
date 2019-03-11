Sequel.migration do
  up do
    create_table :states do
      Uuid     :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
      String   :json, null: false, type: 'json', default: '{}'

      foreign_key :user_id, :users, type: :uuid, null: false, on_delete: :cascade
      foreign_key :visualization_id, :visualizations, type: :uuid, null: false, on_delete: :cascade
    end

    alter_table :states do
      add_index [:visualization_id, :user_id]
    end
  end

  down do
    drop_table :states
  end
end
