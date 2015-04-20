Sequel.migration do
  up do
    add_column :geocodings, :region_code, :text
  end
  down do
    drop_column :geocodings, :region_code
  end
end
