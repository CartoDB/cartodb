Sequel.migration do
  up do
    add_column :visualizations, :attributions, :text
  end

  down do
    drop_column :visualizations, :attributions
  end
end
