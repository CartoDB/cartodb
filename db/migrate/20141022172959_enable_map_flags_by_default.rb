Sequel.migration do
  up do

    drop_column :organizations, :here_maps_enabled
    drop_column :organizations, :stamen_maps_enabled

    drop_column :users, :here_maps_enabled
    drop_column :users, :stamen_maps_enabled

    add_column :organizations, :here_maps_enabled, :boolean, default: true
    add_column :organizations, :stamen_maps_enabled, :boolean, default: true

    add_column :users, :here_maps_enabled, :boolean, default: true
    add_column :users, :stamen_maps_enabled, :boolean, default: true
  end

  down do
    add_column :organizations, :here_maps_enabled
    add_column :organizations, :stamen_maps_enabled

    add_column :users, :here_maps_enabled, :boolean
    add_column :users, :stamen_maps_enabled, :boolean

    drop_column :organizations, :here_maps_enabled
    drop_column :organizations, :stamen_maps_enabled

    drop_column :users, :here_maps_enabled
    drop_column :users, :stamen_maps_enabled
  end
end
