class OverlaysMigration < Sequel::Migration
  def up
    create_table :overlays do
      String      :id,                null: false, primary_key: true
      Integer     :order,             null: false
      String      :options,           text: true
      String      :visualization_id,  index: true
    end
  end #up
  
  def down
    drop_table :overlays
  end #down
end # OverlaysMigration

