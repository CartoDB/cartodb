class DropColumTheGeomTypeMigration < Sequel::Migration

  def up
    drop_column :user_tables, :the_geom_type
  end

  def down
    add_column :user_tables, :the_geom_type, 'character varying'
  end

end
