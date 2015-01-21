Sequel.migration do
  up do
    add_column :layers, :parent_id, :uuid
  end

  down do
    drop_column :layers, :parent_id
  end
end
