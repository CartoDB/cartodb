namespace :carto do
  namespace :dbdirect do

    def save_certs(username, name, id, arn, data, output_directory)
      base_filename = "#{username}_#{name}"
      key_filename = File.join(output_directory, "#{base_filename}.key")
      crt_filename = File.join(output_directory, "#{base_filename}.crt")
      ca_filename = File.join(output_directory, "server_ca.crt")
      puts "Certificate #{name} generated for #{username}"
      puts "  id: #{id}"
      puts "  arn: #{arn}"
      [[:client_key, key_filename], [:client_crt, crt_filename], [:server_ca, ca_filename]].each do |datum, filename|
        File.open(filename, 'w') do |file|
          file.write data[datum]
        end
        puts "#{datum} written to #{filename}"
      end
    end

    def ok_to_revoke?(cert)
      STDOUT.puts "About to revoke certificate #{cert.name} for user #{cert.user.username}. Are you sure? (y/n)"
      input = STDIN.gets.strip
      return input == 'y'
    end

    desc "Generate DB direct certificate"
    task :generate_certificate, [:username, :name, :password, :ips, :validity] => :environment do |t, args|
      user = Carto::User.find_by_username(args.username)
      raise "User #{args.username} not found" unless user

      data, cert = Carto::DbdirectCertificate.generate(
        user: user,
        name: args.name,
        passphrase: args.password,
        ips: args.ips,
        validity_days: args.validity.blank? ? 365 : args.validity.to_i,
        server_ca: true
      )

      save_certs user.username, cert.name, cert.id, cert.arn, data, '.'
    end

    desc "Revoke DB direct certificate"
    task :revoke_certificate, [:id] => :environment do |t, args|
      cert = Carto::DbdirectCertificate.find(args.id)
      raise "Certificate #{args.id} not found" unless cert
      if ok_to_revoke?(cert)
        puts "Revoking certificate #{cert.name} for user #{cert.user.username}"
        puts "  ARN: #{cert.arn}"
        puts "  Expiration was #{cert.expiration}"
        puts "  IPs was #{cert.ips}"
        cert.destroy!
        puts "DESTROYED!!"
      end
    end
  end
end
