Sequel.migration do
  up do
    SequelRails.connection.transaction do
      Rake::Task['cartodb:permissions:fill_missing_permissions'].invoke(true) unless Carto::Visualization.count == 0
      alter_table :visualizations do
        set_column_allow_null :permission_id, false
        add_foreign_key [:permission_id], :permissions, null: false
      end
    end
  end

  down do
    alter_table :visualizations do
      drop_constraint :visualizations_permission_id_fkey
      set_column_allow_null :permission_id, true
    end
  end
end
