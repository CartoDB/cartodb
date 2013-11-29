Sequel.migration do
  up do
    add_column :users, :notification, :text
  end

  down do
    drop_column :users, :notification, :text
  end
end
