class AddSubdomainsMigration < Sequel::Migration

  def up
    add_column :users, :subdomain, 'character varying'
    
    alter_table(:users) do
      add_index [:subdomain], :unique => true
    end
  end

  def down
    drop_column :users, :subdomain
  end

end
