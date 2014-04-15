Sequel.migration do
  up do
    add_column :visualizations, :url_options, :text
  end
  down do
    drop_column :visualizations, :url_options
  end
end
