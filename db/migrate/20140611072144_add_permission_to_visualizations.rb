Sequel.migration do
  up do
    add_column :visualizations, :permission_id, :uuid
  end

  down do
    drop_column :visualizations, :permission_id
  end
end
