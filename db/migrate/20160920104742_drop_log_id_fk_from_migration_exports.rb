Sequel.migration do
  up do
    alter_table :user_migration_exports do
      drop_constraint :user_migration_exports_log_id_fkey
    end
    alter_table :user_migration_imports do
      drop_constraint :user_migration_imports_log_id_fkey
    end
  end

  down do
    alter_table :user_migration_exports do
      add_foreign_key [:log_id], :logs, null: false
    end
    alter_table :user_migration_imports do
      add_foreign_key [:log_id], :logs, null: false
    end
  end
end
