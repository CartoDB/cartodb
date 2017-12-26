class AddTheGeomTypeToTablesMigration < Sequel::Migration

  def up
    add_column :user_tables, :the_geom_type, 'character varying'
  end

  def down
    drop_column :user_tables, :the_geom_type
  end

end
