Sequel.migration do
  up do
    add_column :users, :organization_id, :uuid
  end

  down do
    drop_column :users, :organization_id
  end
end
