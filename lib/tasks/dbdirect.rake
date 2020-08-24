require_relative '../../lib/carto/dbdirect/metadata_manager'

namespace :carto do
  namespace :dbdirect do

    def save_certs(username, name, id, arn, data, output_directory)
      base_filename = "#{username}_#{name}"
      key_filename = File.join(output_directory, "#{base_filename}.key")
      crt_filename = File.join(output_directory, "#{base_filename}.crt")
      ca_filename = File.join(output_directory, "server_ca.crt")
      pk8_filename = File.join(output_directory, "#{base_filename}.key.pk8")
      puts "Certificate #{name} generated for #{username}"
      puts "  id: #{id}"
      puts "  arn: #{arn}"
      files = [
        [:client_key, key_filename],
        [:client_key_pk8, pk8_filename, 'b'],
        [:client_crt, crt_filename],
        [:server_ca, ca_filename]
      ]
      files.each do |datum, filename, binary|
        File.open(filename, "w#{binary}") do |file|
          file.write data[datum]
        end
        puts "#{datum} written to #{filename}"
      end
    end

    def ok_to_revoke?(cert)
      STDOUT.puts "About to revoke certificate #{cert.name} for user #{cert.user.username}. Are you sure? (y/n)"
      input = STDIN.gets.strip
      input == 'y'
    end

    desc "Generate DB direct certificate"
    task :generate_certificate, [:username, :name, :password, :validity] => :environment do |_t, args|
      user = Carto::User.find_by_username(args.username)
      raise "User #{args.username} not found" unless user

      data, cert = Carto::DbdirectCertificate.generate(
        user: user,
        name: args.name,
        passphrase: args.password,
        validity_days: args.validity.blank? ? 365 : args.validity.to_i,
        server_ca: true,
        pk8: true
      )

      save_certs user.username, cert.name, cert.id, cert.arn, data, '.'
    end

    desc "Show DB direct user certificates"
    task :user_certificates, [:username] => :environment do |_t, args|
      user = Carto::User.find_by_username(args.username)
      raise "User #{args.username} not found" unless user

      user.dbdirect_certificates.each do |certificate|
        puts "#{certificate.name}:"
        puts "  id: #{certificate.id}"
        puts "  expires: #{certificate.expiration}"
        puts "  arn: #{certificate.arn}"
      end
    end

    desc "Show DB direct organization certificates"
    task :organization_certificates, [:org] => :environment do |_t, args|
      organization = Carto::Organization.find_by_id(args.org) || Carto::Organization.find_by_name(args.org)
      raise "Couldn't find organization #{args.org.inspect}" unless organization.present?

      organization.users.each do |user|
        user.dbdirect_certificates.each do |certificate|
          puts "#{certificate.name}:"
          puts "  username: #{user.username}"
          puts "  id: #{certificate.id}"
          puts "  expires: #{certificate.expiration}"
          puts "  arn: #{certificate.arn}"
        end
      end
    end

    desc "Revoke DB direct certificate"
    task :revoke_certificate, [:id] => :environment do |_t, args|
      cert = Carto::DbdirectCertificate.find(args.id)
      raise "Certificate #{args.id} not found" unless cert

      if ok_to_revoke?(cert)
        puts "Revoking certificate #{cert.name} for user #{cert.user.username}"
        puts "  ARN: #{cert.arn}"
        puts "  Expiration was #{cert.expiration}"
        cert.destroy!
        puts "DESTROYED!!"
      end
    end

    desc "Show organization ips"
    task :get_organization_ips, [:org] => :environment do |_t, args|
      organization = Carto::Organization.find_by_id(args.org) || Carto::Organization.find_by_name(args.org)
      raise "Couldn't find organization #{args.org.inspect}" unless organization.present?

      ips = organization.dbdirect_effective_ips
      org_id = "#{organization.name} (#{organization.id})"
      if ips.present?
        puts "DBDirect IPs for organization #{org_id}:"
        puts ips
      else
        puts "No IPs defined for organization #{org_id}"
      end
    end

    desc "Show user ips"
    task :get_user_ips, [:user_spec] => :environment do |_t, args|
      user = Carto::User.find_by_id(args.user_spec) || Carto::User.find_by_username(args.user_spec)
      raise "Couldn't find user #{args.user_spec.inspect}" unless user.present?

      ips = user.dbdirect_effective_ips
      user_id = "#{user.username} (#{user.id})"
      if ips.present?
        puts "DBDirect IPs for user #{user_id}:"
        puts ips
      else
        puts "No IPs defined for user #{user_id}"
      end
    end

    desc "Save orgnization ips (use ; to separate ips)"
    task :set_organization_ips, [:org, :ips] => :environment do |_t, args|
      organization = Carto::Organization.find_by_id(args.org) || Carto::Organization.find_by_name(args.org)
      raise "Couldn't find organization #{args.org.inspect}" unless organization.present?

      set_ips = args.ips.present? ? args.ips.split(';') : []

      org_id = "#{organization.name} (#{organization.id})"
      old_ips = organization.dbdirect_effective_ips
      organization.dbdirect_effective_ips = set_ips
      organization.reload
      new_ips = organization.dbdirect_effective_ips
      if old_ips.present?
        puts "Previous DBDirect IPs for organization #{org_id}:"
        puts old_ips
      end
      if new_ips.blank?
        if old_ips.present?
          puts "IPs deleted for organization #{org_id}:"
        else
          puts "No changes"
        end
      else
        puts "New IPs for organization #{org_id}:"
        puts new_ips
      end
    end

    desc "Check database and redis metadata are in sync"
    task :check_metadata_sync, [] => :environment do |_t, args|
      config = Cartodb.get_config(:dbdirect, 'metadata_persist') || {}
      raise "Config entries for dbdirect:metadata_persist are missing" unless config.any?

      metadata_manager = Carto::Dbdirect::MetadataManager.new(config, $users_metadata)

      Carto::User.find_each do |user|
        database_ips = user.dbdirect_effective_ips.sort
        metadata_ips = metadata_manager.get(user.username).sort

        diff = database_ips - metadata_ips | metadata_ips - database_ips
        if diff.any?
          puts "#{user.username} not in sync:"
          puts "  > Database: #{database_ips.join(', ')}"
          puts "  > Metadata: #{metadata_ips.join(', ')}"
          puts "  > Diff: #{diff.join(', ')}"
          puts ""
        end
      end
    end
  end
end
