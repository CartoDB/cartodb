Sequel.migration do
  up do
    add_column :data_imports, :create_visualization, :boolean, default: false
    add_column :data_imports, :visualization_id, :uuid, default: nil
  end

  down do
    drop_column :data_imports, :create_visualization
    drop_column :data_imports, :visualization_id
  end
end
