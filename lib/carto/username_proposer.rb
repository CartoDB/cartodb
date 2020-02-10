module Carto
  class UsernameProposer
    def self.find_unique(candidate_username, offset: 0, max_retries: 99)
      suffix = "-#{offset}" if offset > 0
      candidate_username_with_suffix = "#{candidate_username}#{suffix}"

      if offset < max_retries && Carto::User.exists?(username: candidate_username_with_suffix)
        find_unique(candidate_username, offset: offset + 1, max_retries: max_retries)
      else
        candidate_username_with_suffix
      end
    end
  end
end
