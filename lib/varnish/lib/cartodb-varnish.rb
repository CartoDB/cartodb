require "net/telnet"

module CartoDB
  class Varnish
    def purge(what)
      ActiveSupport::Notifications.instrument('purge.varnish', what: what) do |payload|
        send_command("purge #{what}") do |result|
          payload[:result] = result
          result =~ /200/
        end
      end
    end

    def purge_url(path)
      ActiveSupport::Notifications.instrument('purge_url.varnish', path: path) do |payload|
        send_command(Cartodb::config[:varnish_management]["purge_command"] + " " + path.gsub('\\', '\\\\\\')) do |result|
          payload[:result] = result
          result =~ /200/
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
          raise "Varnish error while trying to connect to #{conf[:host]}:#{conf[:port]} #{e}"
        end
      end
      response
    end
  end
end
