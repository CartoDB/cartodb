Sequel.migration do
  up do
    add_column :geocodings, :table_id, :integer
  end

  down do
    drop_column :geocodings, :table_id
  end
end
