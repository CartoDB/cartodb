require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    drop_column :visualizations, :state_id
  end,
  Proc.new do
    alter_table :visualizations do
      add_foreign_key :state_id, :states, type: 'uuid', null: true
    end

    # The following code should be executed to restore the index for state_id
    # SequelRails.connection.run %{
    #   CREATE INDEX CONCURRENTLY "visualizations_state_id_index"
    #     ON "visualizations" ("state_id");
    # }
  end
)
