Sequel.migration do
  up do
    alter_table :organizations do
      add_column :builder_enabled, :boolean, null: false, default: false
    end

    alter_table :users do
      set_column_default :builder_enabled, false
    end
  end

  down do
    alter_table :organizations do
      drop_column :builder_enabled
    end

    alter_table :users do
      set_column_default :builder_enabled, true
    end
  end
end
