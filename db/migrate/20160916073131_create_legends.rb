Sequel.migration do
  up do
    create_table :legends do
      foreign_key :layer_id, :layers, type: 'uuid', null: false, on_delete: :cascade

      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP

      String :title
      String :pre_html
      String :post_html
      String :type, null: false
      String :definition, null: false, type: 'json'
    end
  end

  down do
    drop_table :legends
  end
end
