Sequel.migration do
  up do
    add_column :organizations, :website, :text
    add_column :organizations, :description, :text
    add_column :organizations, :display_name, :text
    add_column :organizations, :discus_shortname, :text
    add_column :organizations, :twitter_username, :text
  end

  down do
    drop_column :organizations, :website
    drop_column :organizations, :description
    drop_column :organizations, :display_name
    drop_column :organizations, :discus_shortname
    drop_column :organizations, :twitter_username
  end
end
