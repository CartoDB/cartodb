namespace :passwords do

  desc 'Include salt in password column (Argon2 format)'
  task :join_password_salt, [:limit] => [:environment] do |_, args|
    select_query = "SELECT id FROM users WHERE salt <> ''"
    select_query = select_query + " LIMIT #{args[:limit]}" if args[:limit]
    query = %(
      UPDATE users
      SET crypted_password = concat('$sha$v=1$$',salt,'$',crypted_password),
      salt = ''
      WHERE id IN (#{select_query})
    )
    ActiveRecord::Base.connection.execute(query)
  end

  desc 'Password encryption stats'
  task :stats => [:environment] do
    sha1_count = Carto::User.where("salt <> ''").count
    sha1_no_salt = Carto::User.where("salt = '' AND crypted_password LIKE '$sha%'").count
    argon2_count = Carto::User.where("salt = '' AND crypted_password LIKE '$argon2%'").count

    puts "Users with SHA1 password: #{sha1_count}"
    puts "Users with SHA1 password and no salt column: #{sha1_no_salt}"
    puts "Users with Argon2 password: #{argon2_count}"
  end

end
