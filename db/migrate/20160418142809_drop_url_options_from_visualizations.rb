Sequel.migration do
  up do
    drop_column :visualizations, :url_options
  end
  down do
    add_column :visualizations, :url_options, :text
  end
end
