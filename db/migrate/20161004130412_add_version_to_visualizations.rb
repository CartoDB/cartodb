Sequel.migration do
  change do
    alter_table :visualizations do
      # This should be non-nullable and default=2 but that forces a db downtime
      add_column :version, :integer, null: true
    end
  end
end
