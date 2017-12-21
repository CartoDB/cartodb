Sequel.migration do
  up do
    add_column :users, :private_maps_enabled, :boolean, default: false
  end

  down do
    drop_column :users, :private_maps_enabled
  end
end
