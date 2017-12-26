Sequel.migration do
  up do
    add_column :users, :disqus_shortname, :text
  end

  down do
    drop_column :users, :disqus_shortname
  end
end
