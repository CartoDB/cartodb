Sequel.migration do
  up do
    add_column :geocodings, :triggered_by, :text
  end
  down do
    drop_column :geocodings, :triggered_by
  end
end
