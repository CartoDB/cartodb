namespace :bus do
  desc 'Consume messages from bus'
  task :consume, [] => [:environment] do |task, args|

    # NOTE: this is a hack that only works in dev envs as Central and
    # CartoDB redis instances are separate. The database number
    # doesn't really matter to the primitives PUBLISH and SUBSCRIBE

    $users_metadata.subscribe(:cloud_sync_users) do |on|
      on.message do |_channel, payload|
        attributes = JSON.parse(payload)
        user_id = attributes.delete('remote_user_id')
        if user_id.present? && attributes.any?
          user = Carto::User.find(user_id)
          user.update(attributes)
          user.save!
        end
      end
    end

  end
end
