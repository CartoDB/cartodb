require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :states do
      set_column_allow_null :user_id
    end
  end,
  Proc.new do
    # Add not null constraint to states.user_id manually, as no default can
    # be provided
  end
)
