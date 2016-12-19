Sequel.migration do
  change do
    alter_table :visualizations do
      add_column :export_geom, :boolean, :default => true
    end
  end
end
