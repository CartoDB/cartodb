Sequel.migration do
  up do
    add_column :users, :twitter_username, :text
  end

  down do
    drop_column :users, :twitter_username
  end
end
