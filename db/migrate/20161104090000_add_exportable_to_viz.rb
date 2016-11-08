Sequel.migration do
  change do
    alter_table :visualizations do
      add_column :exportable, :boolean, :default => true
    end
  end
end
