class AddErrorCodeToGeocodings < Sequel::Migration

  def up
    add_column :geocodings, :error_code, :integer
  end

  def down
    drop_column :geocodings, :error_code  
  end

end
