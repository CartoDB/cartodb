Sequel.migration do
  up do
    create_table :mapcaps do
      foreign_key :visualization_id, :visualizations, type: 'uuid', null: false, on_delete: :cascade

      Uuid :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')

      String :export_json, null: false, type: 'json'
      String :ids_json, null: false, type: 'json'

      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
    end

    alter_table :mapcaps do
      add_index :visualization_id
    end
  end

  down do
    alter_table :mapcaps do
      drop_index :visualization_id
    end

    drop_table :mapcaps
  end
end
