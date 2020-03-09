require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :assets do
      add_foreign_key :visualization_id,
                      :visualizations,
                      type: :uuid,
                      on_delete: :cascade

      add_index [:visualization_id]
    end
  end,
  Proc.new do
    alter_table :assets do
      drop_index :visualization_id
      drop_column :visualization_id
    end
  end
)
