Sequel.migration do
  up do
    alter_table :organizations do
      add_column :builder_enabled, :boolean, null: false, default: false
    end

    Rails::Sequel.connection.run('UPDATE users SET builder_enabled = true WHERE builder_enabled IS NULL')
    alter_table :users do
      set_column_default :builder_enabled, false
      set_column_not_null :builder_enabled
    end
  end

  down do
    alter_table :organizations do
      drop_column :builder_enabled
    end

    alter_table :users do
      set_column_allow_null :builder_enabled
      set_column_default :builder_enabled, true
    end
  end
end
