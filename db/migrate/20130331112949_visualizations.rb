# encoding: utf-8

class VisualizationsMigration < Sequel::Migration
  def up
    create_table :visualizations do
      String      :id,          null: false
      String      :name,        text: true
      String      :description, text: true
      String      :map_id,      index: true
      String      :kind
    end
  end #up
  
  def down
    drop_table :visualizations
  end #down
end # VisualizationsMigration

