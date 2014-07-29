Sequel.migration do
  up do
    add_column :visualizations, :locked, :boolean, null: false, default: false
  end

  down do
    drop_column :visualizations, :locked
  end

end
