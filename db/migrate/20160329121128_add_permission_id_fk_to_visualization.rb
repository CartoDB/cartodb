Sequel.migration do
  up do
    alter_table :visualizations do
      set_column_allow_null :permission_id, false
      add_foreign_key [:permission_id], :permissions, null: false
    end
  end

  down do
    alter_table :visualizations do
      drop_constraint :visualizations_permission_id_fkey
      set_column_allow_null :permission_id, true
    end
  end
end
