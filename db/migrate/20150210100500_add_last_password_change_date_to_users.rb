Sequel.migration do
  up do
    add_column :users, :last_password_change_date, DateTime
  end
  down do
    drop_column :users, :last_password_change_date
  end
end
