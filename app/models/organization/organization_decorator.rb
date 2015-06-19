module CartoDB
  module OrganizationDecorator
    def data(options = {})
      {
        created_at:        self.created_at,
        description:       self.description,
        discus_shortname:  self.discus_shortname,
        display_name:      self.display_name,
        id:                self.id,
        name:              self.name,
        owner: {
          id:         self.owner ? self.owner.id : nil,
          username:   self.owner ? self.owner.username : nil,
          avatar_url: self.owner ? self.owner.avatar : nil
        },
        quota_in_bytes:  self.quota_in_bytes,
        api_calls:       self.get_api_calls(from: self.owner.present? ? self.owner.last_billing_cycle : nil, to: Date.today),
        api_calls_quota: self.map_view_quota,
        geocoding: {
          quota:       self.geocoding_quota,
          monthly_use: self.get_geocoding_calls
        },
        twitter: {
          enabled:     self.twitter_datasource_enabled,
          quota:       self.twitter_datasource_quota,
          block_price: self.twitter_datasource_block_price,
          block_size:  self.twitter_datasource_block_size,
          monthly_use: self.get_twitter_imports_count
        },
        seats:             self.seats,
        twitter_username:  self.twitter_username,
        updated_at:        self.updated_at,
        website:           self.website,
        avatar_url:        self.avatar_url
      }
    end
  end
end
