class RemoveSubdomainFromUsersMigration < Sequel::Migration

  def up
    drop_column :users, :subdomain
  end

  def down
    add_column :users, :subdomain, 'character varying'
    alter_table(:users) do
      add_index [:subdomain], :unique => true
    end
  end

end
