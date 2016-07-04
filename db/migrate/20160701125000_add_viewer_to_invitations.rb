Sequel.migration do
  up do
    alter_table(:invitations) do
      add_column :viewer, :boolean, null: false, default: false
    end
  end

  down do
    alter_table(:invitations) do
      drop_column :viewer
    end
  end
end
