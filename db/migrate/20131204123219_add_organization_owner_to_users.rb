Sequel.migration do
  up do
    add_column :users, :organization_owner, :boolean, default: false
  end

  down do
    drop_column :users, :organization_owner
  end
end
