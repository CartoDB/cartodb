Sequel.migration do
  up do
    add_column :users, :arcgis_datasource_enabled, :boolean
  end

  down do
    drop_column :users, :arcgis_datasource_enabled
  end
end
