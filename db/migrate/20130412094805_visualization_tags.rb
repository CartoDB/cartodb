# encoding: utf-8

class VisualizationsTagsMigration < Sequel::Migration
  def up
    SequelRails.connection.run(%q{
      ALTER TABLE "visualizations"
      ADD COLUMN tags text[]
    })
  end #up
  
  def down
    drop_column :visualizations, :tags
  end #down
end #VisualizationsTagsMigration

