Sequel.migration do
  up do
    add_column :geocodings, :region_code, :text
    add_column :geocodings, :region_column, :text
  end
  down do
    drop_column :geocodings, :region_code
    drop_column :geocodings, :region_column
  end
end
