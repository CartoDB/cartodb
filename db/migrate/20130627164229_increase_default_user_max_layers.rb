class IncreaseDefaultUserMaxLayers < Sequel::Migration
  def up
    alter_table :users do
      set_column_default :max_layers, 4
    end
    ::User.db.run("UPDATE users set max_layers = 4")
  end #up

  def down
    alter_table :users do
      set_column_default :max_layers, 3
    end
    ::User.db.run("UPDATE users set max_layers = 3")
  end #down
end
