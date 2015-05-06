Sequel.migration do
  up do
    add_column :organizations, :google_maps_key, :text
    add_column :users, :google_maps_key, :text
  end

  down do
    drop_column :organizations, :google_maps_key
    drop_column :users, :google_maps_key
  end
end
