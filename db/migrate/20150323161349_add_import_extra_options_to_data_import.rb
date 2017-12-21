Sequel.migration do
  up do
    add_column :data_imports, :import_extra_options, :text 
  end
  down do
    drop_column :data_imports, :import_extra_options
  end
end
