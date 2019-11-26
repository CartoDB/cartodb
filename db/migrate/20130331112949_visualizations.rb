class VisualizationsMigration < Sequel::Migration
  def up
    create_table :visualizations do
      String      :id,          null: false, primary_key: true
      String      :name,        text: true
      String      :description, text: true
      String      :map_id,      index: true
      String      :type
    end
  end #up
  
  def down
    drop_table :visualizations
  end #down
end # VisualizationsMigration

