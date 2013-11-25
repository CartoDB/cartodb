Sequel.migration do
  up do
    drop_column :automatic_geocodings, :run_at
    drop_column :automatic_geocodings, :interval
    add_column  :automatic_geocodings, :ran_at, DateTime
  end
  
  down do
    add_column :automatic_geocodings, :run_at, DateTime
    add_column :automatic_geocodings, :interval, :integer
    drop_column  :automatic_geocodings, :ran_at
  end
end
