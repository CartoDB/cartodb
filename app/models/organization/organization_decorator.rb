module CartoDB
  module OrganizationDecorator
    def data(options = {})
      {
        :id             => self.id,
        :seats          => self.seats,
        :quota_in_bytes => self.quota_in_bytes,
        :created_at     => self.created_at,
        :updated_at     => self.updated_at,
        :name           => self.name,
        :owner          => {
          :id           => self.owner ? self.owner.id : nil,
          :username     => self.owner ? self.owner.username : nil,
          :avatar_url   => self.owner ? self.owner.avatar_url : nil
        },
        :users          => self.users.map { |u|
          {
            :id       => u.id,
            :username => u.username,
            :avatar_url => u.avatar_url
          }
        }
      }
    end
  end
end