Sequel.migration do
  up do
    drop_column :users, :last_active_time
  end

  down do
    add_column :users, :last_active_time, :timestamp
  end
end
