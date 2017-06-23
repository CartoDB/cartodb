require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    set_column_default :maps, :scrollwheel, true
  end,
  Proc.new do
    set_column_default :maps, :scrollwheel, false
  end
)
