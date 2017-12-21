Sequel.migration do
  up do
    add_column :users, :last_common_data_update_date, DateTime
  end
  down do
    drop_column :users, :last_common_data_update_date
  end
end
