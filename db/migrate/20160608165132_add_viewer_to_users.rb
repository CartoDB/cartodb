Sequel.migration do
  up do
    alter_table(:users) do
      add_column :viewer, :boolean, null: false, default: false
    end
  end

  down do
    alter_table(:users) do
      drop_column :viewer
    end
  end
end
