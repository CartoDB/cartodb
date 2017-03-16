Sequel.migration do
  up do
    add_column :visualizations, :category, :integer, :default => -1
  end

  down do
    drop_column :visualizations, :category
  end
end