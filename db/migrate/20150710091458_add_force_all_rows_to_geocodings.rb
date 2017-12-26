class AddForceAllRowsToGeocodings < Sequel::Migration

  def up
    add_column :geocodings, :force_all_rows, :boolean, default: false
  end

  def down
    drop_column :geocodings, :force_all_rows
  end

end
