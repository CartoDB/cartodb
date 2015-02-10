Sequel.migration do
  up do
    add_column :users, :max_import_file_size, :integer, null: false, default: 100*1024*1024
  end
  down do
    drop_column :users, :max_import_file_size
  end
end
