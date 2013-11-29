Sequel.migration do
  up do
    add_column :automatic_geocodings, :original_geocoding_id, :integer
  end

  down do
    drop_column :geocodings, :original_geocoding_id
  end
end
