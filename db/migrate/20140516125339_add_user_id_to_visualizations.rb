Sequel.migration do
  up do
    add_column :visualizations, :user_id, :uuid
  end

  down do
    drop_column :visualizations, :user_id
  end
end
