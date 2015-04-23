Sequel.migration do
  up do
    add_column :users, :max_import_table_row_count, :integer, null: false, default: 500000
  end
  down do
    drop_column :users, :max_import_table_row_count
  end
end
