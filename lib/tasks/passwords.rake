namespace :passwords do

  desc 'Include salt in password column (Argon2 format)'
  task :join_password_salt, [:limit] => [:environment] do |_, args|
    total = Carto::User.where("salt <> ''").limit(args[:limit]).count
    index = 0

    Carto::User.where("salt <> ''").limit(args[:limit]).find_each do |user|
      begin
        user.crypted_password = "$sha$v=1$$#{user.salt}$#{user.crypted_password}"
        user.salt = ""
        user.save!

        index += 1
        puts "#{index}/#{total}" if (index % 100).zero? 
      rescue StandardError => e
        puts "Error saving user with id #{user.id}: #{e.message}"
      end
    end
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
