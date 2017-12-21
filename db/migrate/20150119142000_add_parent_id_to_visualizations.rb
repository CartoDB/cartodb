Sequel.migration do
  up do
    add_column :visualizations, :parent_id, :uuid
  end

  down do
    drop_column :visualizations, :parent_id
  end
end
