Sequel.migration do
  up do
    drop_column :automatic_geocodings, :original_geocoding_id
    add_column :geocodings, :automatic_geocoding_id, :integer
  end
  
  down do
    drop_column :geocodings, :automatic_geocoding_id
    add_column :automatic_geocodings, :original_geocoding_id, :integer
  end
end
