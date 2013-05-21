Sequel.migration do
  change do
    alter_table :visualizations do
      add_column :privacy, String
    end
  end
end
