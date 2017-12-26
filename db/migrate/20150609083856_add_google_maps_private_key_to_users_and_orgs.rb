Sequel.migration do
  up do
    add_column :organizations, :google_maps_private_key, :text, default: nil
    add_column :users, :google_maps_private_key, :text, default: nil
  end

  down do
    drop_column :organizations, :google_maps_private_key
    drop_column :users, :google_maps_private_key
  end
end
