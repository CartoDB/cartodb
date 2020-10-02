require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    alter_table :users do
      add_column :company_employees, String
      add_column :use_case, String
    end
  end,
  proc do
    alter_table :users do
      drop_column :company_employees
      drop_column :use_case
    end
  end
)
