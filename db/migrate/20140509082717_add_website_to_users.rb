Sequel.migration do
  up do
    add_column :users, :website, :text
  end

  down do
    drop_column :users, :website
  end
end
