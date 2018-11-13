require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :user_multifactor_auths do
      add_unique_constraint [:user_id, :type]
    end
  end,
  Proc.new do
    alter_table :user_multifactor_auths do
      drop_constraint :user_multifactor_auths_user_id_type_key
    end
  end
)
