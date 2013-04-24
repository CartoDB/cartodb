# encoding: utf-8

class VisualizationsMigration < Sequel::Migration
  def up
    drop_table :visualizations
    create_table :visualizations do
      String      :id,          null: false, primary_key: true
      String      :name,        text: true
      String      :description, text: true
      Integer     :map_id,      index: true
      String      :type
      Array       :tags
    end

    Rails::Sequel.connection.run(%q{
      ALTER TABLE "visualizations"
      ADD COLUMN tags text[]
    })
  end #up
  
  def down
  end #down
end # VisualizationsMigration

