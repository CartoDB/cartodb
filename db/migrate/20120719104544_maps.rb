class MapsMigration < Sequel::Migration

  def up
    create_table :maps do
      primary_key :id
      Integer     :user_id, :null => false, :index => true
      String      :provider, :text => true
      String      :bounding_box_sw, :text => true
      String      :bounding_box_ne, :text => true
      String      :center, :text => true
      Integer     :zoom
    end
  end

  def down
    drop_table :maps
  end

end
