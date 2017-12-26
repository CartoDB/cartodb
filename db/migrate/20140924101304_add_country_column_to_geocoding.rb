Sequel.migration do
  up do
    add_column :geocodings, :country_column, :text
  end
  down do
    drop_column :geocodings, :country_column
  end
end