Sequel.migration do
  up do
    alter_table :assets do
      add_foreign_key :organization_id,
                      :organizations,
                      type: 'uuid',
                      on_delete: :cascade

      add_index :organization_id
    end
  end

  down do
    drop_column :assets, :organization_id
  end
end
