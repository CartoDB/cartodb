require "net/telnet"
require_relative '../../carto/http/client'

module CartoDB
  class Varnish
    def purge(what)
      ActiveSupport::Notifications.instrument('purge.varnish', what: what) do |payload|
        conf = Cartodb::config[:varnish_management]
        if conf['http_port']
          request = http_client.request(
            "http://#{conf['host']}:#{conf['http_port']}/batch", method: :purge, headers: {"Invalidation-Match" => what}).run
          return request.code
        else
          return send_command("#{purge_command} obj.http.X-Cache-Channel ~ #{what}") do |result|
            payload[:result] = result
            result
          end
        end
      end
    end

    def purge_surrogate_key(key)
      ActiveSupport::Notifications.instrument('purge.varnish', what: key) do |payload|
        conf = Cartodb::config[:varnish_management]
        if conf['http_port']
          request = http_client.request(
            "http://#{conf['host']}:#{conf['http_port']}/key", method: :purge, headers: {"Invalidation-Match" => key}).run
          return request.code
        else
          return send_command("#{purge_command} obj.http.Surrogate-Key ~ #{key}") do |result|
            payload[:result] = result
            result
          end
        end
      end
    end

    def send_command(command)
      retries = 0
      response = nil
      conf = Cartodb::config[:varnish_management]
      begin
        retries += 1
        connection = Net::Telnet.new(
          'Host' => conf["host"],
          'Port' => conf["port"],
          'Timeout' => conf["timeout"] || 5)

        connection.cmd('String' => command, 'Match' => /\n\n/) {|r| response = r.split("\n").first.strip}
        connection.close if connection.respond_to?(:close)
      rescue Exception => e
        if retries < conf["retries"]
          retry
        else
          if Cartodb::config[:varnish_management]["critical"] == true
            raise "Varnish error while trying to connect to #{conf["host"]}:#{conf["port"]} #{e}"
          end
        end
      end
      response
    end

    private

    def purge_command
      Cartodb::config[:varnish_management]["purge_command"]
    end #purge_command

    def url_purge_command
      Cartodb::config[:varnish_management]["url_purge_command"]
    end #purge_command

    def http_client
      @http_client ||= Carto::HttpClient.get('varnish')
    end
  end # Varnish
end # CartoDB
