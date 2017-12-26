Sequel.migration do
  up do
    add_column :visualizations, :license, :text
    add_column :visualizations, :title, :text
  end

  down do
    drop_column :visualizations, :license
    drop_column :visualizations, :title
  end
end