# encoding: utf-8

namespace :cartodb do
  namespace :services do
    namespace :external do
      namespace :google do
        desc 'Enable Google Services for a given user'
        task :enable_for_user, [:google_maps_key, :google_maps_private_key, :username] => [:environment] do |task, args|
          user = Carto::User.where(username: args[:username]).first

          raise "No user with username '#{args[:username]}'" if user.nil?

          puts "Enabling google services for user '#{user.username}'..."

          user.google_maps_key = args[:google_maps_key]
          user.google_maps_private_key = args[:google_maps_private_key] unless args[:google_maps_private_key].blank?

          puts user.errors.full_messages unless user.save
        end

        desc 'Enable Google Services for an organization'
        task :enable_for_organization,
             [:google_maps_key, :google_maps_private_key, :org_name] => [:environment] do |task, args|
          organization = Carto::Organization.where(name: args[:org_name]).first

          raise "No organization with name '#{args[:org_name]}'" if organization.nil?

          puts "Enabling google services for organization '#{organization.name}'..."

          organization.google_maps_key = args[:google_maps_key]

          unless args[:google_maps_private_key].blank?
            organization.google_maps_private_key = args[:google_maps_private_key]
          end

          puts organization.errors.full_messages unless organization.save
        end

        desc 'Enable Google Services for all users'
        task :enable_for_all, [:google_maps_key, :google_maps_private_key] => [:environment] do |task, args|
          Carto::Organization.all.each do |organization|
            puts "Enabling google services for organization '#{organization.name}'..."

            organization.google_maps_key = args[:google_maps_key]

            unless args[:google_maps_private_key].blank?
              organization.google_maps_private_key = args[:google_maps_private_key]
            end

            puts organization.errors.full_messages unless organization.save
          end

          # For users not in organizations
          Carto::User.where(organization_id: nil).each do |user|
            puts "Enabling google services for non-organization user '#{user.username}'..."

            user.google_maps_key = args[:google_maps_key]
            user.google_maps_private_key = args[:google_maps_private_key] unless args[:google_maps_private_key].blank?

            puts user.errors.full_messages unless user.save
          end
        end

        desc 'Disable Google Services for a given user'
        task :disable_for_user, [:username] => [:environment] do |task, args|
          user = Carto::User.where(username: args[:username]).first

          raise "No user with username '#{args[:username]}'" if user.nil?

          puts "Disabling google services for user '#{user.username}'..."

          user.google_maps_key = nil
          user.google_maps_private_key = nil

          puts user.errors.full_messages unless user.save
        end

        desc 'Disable Google Services for an organization'
        task :disable_for_organization, [:org_name] => [:environment] do |task, args|
          organization = Carto::Organization.where(name: args[:org_name]).first

          raise "No organization with name '#{args[:org_name]}'" if organization.nil?

          puts "Disabling google services for organization '#{organization.name}'..."

          organization.google_maps_key = nil
          organization.google_maps_private_key = nil

          puts organization.errors.full_messages unless organization.save
        end

        desc 'Disable Google Services for all users'
        task :disable_for_all => [:environment] do |task|
          Carto::Organization.all.each do |organization|
            puts "Disabling google services for organization '#{organization.name}'..."

            organization.google_maps_key = nil
            organization.google_maps_private_key = nil

            puts organization.errors.full_messages unless organization.save
          end

          # For users not in organizations
          Carto::User.where(organization_id: nil).each do |user|
            puts "Disabling google services for non-organization user '#{user.username}'..."

            user.google_maps_key = nil
            user.google_maps_private_key = nil

            puts user.errors.full_messages unless user.save
          end
        end
      end
    end
  end
end
