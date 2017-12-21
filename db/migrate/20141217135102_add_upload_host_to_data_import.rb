Sequel.migration do
  up do
    add_column :data_imports, :upload_host, :text
  end

  down do
    drop_column :data_imports, :upload_host
  end
end
