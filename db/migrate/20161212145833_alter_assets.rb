Sequel.migration do
  up do
    alter_table :assets do
      add_foreign_key :organization_id,
                      :organizations,
                      type: 'uuid',
                      on_delete: :cascade

      add_index :organization_id

      add_column :storage_type, :text
      add_column :identifier, :text
      add_column :location, :text
    end
  end

  down do
    alter_table :assets do
      drop_column :organization_id
      drop_column :storage_type
      drop_column :identifier
      drop_column :location
    end
  end
end
