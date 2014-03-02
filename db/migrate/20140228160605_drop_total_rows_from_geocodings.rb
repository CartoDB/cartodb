Sequel.migration do
  up do
    drop_column :geocodings, :total_rows
  end
  
  down do
    add_column :geocodings, :total_rows, :integer, default: 0
  end
end
