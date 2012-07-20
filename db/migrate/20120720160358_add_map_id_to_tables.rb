class AddMapIdToTablesMigration < Sequel::Migration

  def up
    add_column :user_tables, :map_id, :bigint
  end

  def down
    drop_column :user_tables, :map_id
  end

end
