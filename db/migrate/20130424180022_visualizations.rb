# encoding: utf-8

class VisualizationsFixMigration < Sequel::Migration
  def up
    SequelRails.connection.run(%Q{
      ALTER TABLE visualizations
      ALTER COLUMN map_id 
      TYPE integer
      USING map_id::integer
    })
  end #up
  
  def down
  end #down
end # VisualizationsFixMigration

