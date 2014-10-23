Sequel.migration do
  up do
    add_column :organizations, :here_maps_enabled, :boolean
    add_column :organizations, :stamen_maps_enabled, :boolean

    add_column :users, :here_maps_enabled, :boolean
    add_column :users, :stamen_maps_enabled, :boolean
  end

  down do
    drop_column :organizations, :here_maps_enabled
    drop_column :organizations, :stamen_maps_enabled

    drop_column :users, :here_maps_enabled
    drop_column :users, :stamen_maps_enabledd
  end
end
