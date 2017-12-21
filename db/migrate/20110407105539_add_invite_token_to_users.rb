class AddInviteTokenToUsersMigration < Sequel::Migration

  def up
    add_column :users, :invite_token, String
    add_column :users, :invite_token_date, Date
  end

  def down
    drop_column :users, :invite_token
    drop_column :users, :invite_token_date
  end

end
