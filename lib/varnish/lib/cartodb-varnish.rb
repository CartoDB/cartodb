require "net/telnet"

module CartoDB
  class Varnish
    def purge(what)
      ActiveSupport::Notifications.instrument('purge.varnish', what: what) do |payload|
        conf = Cartodb::config[:varnish_management]
        request = Typhoeus::Request.new(
		"http://#{conf['host']}:6081/batch", method: :purge, headers: {"Invalidation-Match" => what}).run
        request.code =~ /200/
      end
    end # purge
  end # Varnish
end # CartoDB
