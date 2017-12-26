Sequel.migration do
  up do
    add_column :users, :name, :text
  end

  down do
    drop_column :users, :name
  end
end
