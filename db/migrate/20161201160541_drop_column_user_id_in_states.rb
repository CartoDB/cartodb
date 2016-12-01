require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :states do
      drop_column :user_id
      add_index :visualization_id
    end
  end,
  Proc.new do
    alter_table :states do
      drop_index :visualization_id

      add_foreign_key :user_id,
                      :users,
                      type: :uuid,
                      on_delete: :cascade

      add_index [:visualization_id, :user_id]
    end
  end
)
