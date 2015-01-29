Sequel.migration do
  up do
    drop_column :users, :here_maps_enabled
    drop_column :users, :stamen_maps_enabled
    drop_column :users, :rainbow_maps_enabled
  end
  down do
  end
end
