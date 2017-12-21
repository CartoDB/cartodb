Sequel.migration do
  up do
    add_column :users, :available_for_hire, :boolean, :default => false
  end

  down do
    drop_column :users, :available_for_hire
  end
end
