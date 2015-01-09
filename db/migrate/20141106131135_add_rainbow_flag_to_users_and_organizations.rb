Sequel.migration do
  up do
    add_column :organizations, :rainbow_maps_enabled, :boolean, default: false
    add_column :users, :rainbow_maps_enabled, :boolean, default: false
  end

  down do
    drop_column :organizations, :rainbow_maps_enabled
    drop_column :users, :rainbow_maps_enabled
  end
end
