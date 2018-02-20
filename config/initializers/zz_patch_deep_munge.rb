# Rails 3.2.10 changed the way JSON parameters are processed, causing empty arrays be changed to nil.
# For example,
#   { options: { query_history: [] } }
# changed to
#   { options: { query_history: nil } }
#
# As you see later this patch keeps compacting arrays, which seems reasonable, but it's not present at 3.2.2, so it can be removed as well if problems arise.
#
# The reason was rack <-> ActiveRecord interaction: http://guides.rubyonrails.org/security.html#unsafe-query-generation. Our backend side should be responsible of querying only if parameters are fine, so that security vulnerability is not a problem for us.
# Change was not reported, of course: https://github.com/rails/rails/blob/3-2-stable/activesupport/CHANGELOG.md#rails-3210-jan-2-2013
# This is the commit: https://github.com/rails/rails/commit/d99e8c9e1618f509bb35f052d4bd0d1848bce771#diff-3179d24efacadd64068c4d9c1184eac3
# Configuration parameter came later: https://github.com/rails/rails/commit/e8572cf2f94872d81e7145da31d55c6e1b074247
# Discussion on the right fix is still ongoing: https://github.com/rails/rails/issues/13420
#
# We can remove this hack once we update to Rails 5 (https://github.com/rails/rails/pull/12251)

module ActionDispatch
  class Request < Rack::Request
    class Utils # :nodoc:

      mattr_accessor :perform_deep_munge
      self.perform_deep_munge = true

      class << self
        # Remove nils from the params hash
        def deep_munge(hash, keys = [])
          return hash unless perform_deep_munge

          hash.each do |k, v|
            keys << k
            case v
            when Array
              v.grep(Hash) { |x| deep_munge(x, keys) }
              v.compact!
              # Patch:
              # if v.empty?
              #  hash[k] = nil
              #  ActiveSupport::Notifications.instrument("deep_munge.action_controller", keys: keys)
              # end
            when Hash
              deep_munge(v, keys)
            end
            keys.pop
          end

          hash
        end
      end
    end
  end
end
