Sequel.migration do
  change do
    create_table :legends do
      foreign_key :layer_id, :layers, type: 'uuid', null: false, on_delete: :cascade

      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP

      String :title
      String :pre_html, null: false
      String :post_html, null: false
      String :type
      String :definition, null: false, type: 'json'
    end
  end
end
