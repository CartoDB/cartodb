Sequel.migration do
  up do
    drop_column :users, :tables_count
  end

  down do
    add_column :users, :tables_count, :integer, default: 0
  end
end
