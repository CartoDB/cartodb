Sequel.migration do
  up do
    create_table :legends do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP

      Uuid :layer_id, type: 'uuid', null: false
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
