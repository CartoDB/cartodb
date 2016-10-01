Sequel.migration do
  up do
    drop_column :users, :arcgis_datasource_enabled
  end

  down do
    add_column :users, :arcgis_datasource_enabled, :boolean, null: false, default: false
  end
end
