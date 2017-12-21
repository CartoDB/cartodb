Sequel.migration do 
  up do

    create_table :automatic_geocodings do
      primary_key :id
      Integer     :table_id
      Text        :state
      DateTime    :run_at
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
      Integer     :interval
      Integer     :retried_times
    end

  end

  down do
    drop_table :automatic_geocodings
  end
end
