# encoding: utf-8

class OverlaysMigration < Sequel::Migration
  def up
    create_table :overlays do
      String    :id,                null: false
      Integer   :order,             null: false
      String    :options,           text: true
      String    :visualization_id,  index: true
    end
  end
  
  def down
    drop_table :overlays
  end #down
end # OverlaysMigration

