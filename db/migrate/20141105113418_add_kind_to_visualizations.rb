Sequel.migration do
  up do
    add_column :visualizations, :kind, :text, null: false, default: 'geom'
  end

  down do
    drop_column :visualizations, :kind
  end
end
