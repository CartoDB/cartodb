module Carto
  class EmailDomainValidator

    def self.validate_domain(email, whitelisted_domains)
      user_domain = email.split('@')[1]
      return false unless user_domain
      user_domain_split = user_domain.split('.').reverse
      if whitelisted_domains.include?(user_domain)
        return true
      end

      whitelisted_domains.each do |whitelist_domain|
        whitelist_domain_split = whitelist_domain.split('.').reverse
        # We don't support this kind of wildcard: a.*.carto.com
        if whitelist_domain_split[-1] == '*'
          filter_result = true
          filter_result = whitelist_domain_split.each.with_index.reduce(filter_result) do |acc, (item, index)|
            acc & (item == '*' || item == user_domain_split[index])
          end
          return true if filter_result
        end
      end

      false
    end
  end
end
