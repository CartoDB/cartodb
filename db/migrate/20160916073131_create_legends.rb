Sequel.migration do
  up do
    create_table :legends do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP

      Uuid :layer_id
      String :title
      String :pre_html
      String :post_html
      String :type, null: false
      String :definition, null: false, type: 'json'
    end

    Rails::Sequel.connection.run %{
      CREATE INDEX CONCURRENTLY "legends_layer_id_index"
        ON "legends" ("layer_id");

      ALTER TABLE legends
        ADD CONSTRAINT "legends_layer_id_fkey" FOREIGN KEY (layer_id)
        USING INDEX legends_layer_id_index
        REFERENCES layers (id); }
  end

  down do
    drop_table :legends
  end
end
