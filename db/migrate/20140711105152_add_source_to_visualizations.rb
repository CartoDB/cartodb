Sequel.migration do
  up do
    add_column :visualizations, :source, :text
  end

  down do
    drop_column :visualizations, :source
  end
end
