class AddTableIndexesMetadataMigration < Sequel::Migration

  def up
    add_column :user_tables, :indexes, 'character varying[]'
  end

  def down
    drop_column :user_tables, :indexes
  end

end
