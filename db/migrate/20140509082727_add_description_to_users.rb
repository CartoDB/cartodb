Sequel.migration do
  up do
    add_column :users, :description, :text
  end

  down do
    drop_column :users, :description
  end
end
