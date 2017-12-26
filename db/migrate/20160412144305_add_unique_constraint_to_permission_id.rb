Sequel.migration do
  up do
    alter_table :visualizations do
      add_unique_constraint :permission_id
    end
  end

  down do
    alter_table :visualizations do
      drop_constraint :visualizations_permission_id_key
    end
  end
end
