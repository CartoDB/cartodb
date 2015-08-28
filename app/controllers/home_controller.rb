# coding: UTF-8

class HomeController < ApplicationController
  layout 'frontend'

  STATUS = Hash.new('warning')
  STATUS[true] = 'ok'
  STATUS[false] = 'error'

  OS_VERSION = "Description:\tUbuntu 12.04"
  PG_VERSION = 'PostgreSQL 9.3'
  POSTGIS_VERSION = '2.1'
  CDB_VALID_VERSION = '0.9'
  CDB_LATEST_VERSION = '0.9.3'
  REDIS_VERSION = '3.0'
  RUBY_BIN_VERSION = 'ruby 1.9.3'
  NODE_VERSION = 'v0.10'
  GEOS_VERSION = '3.4.2'
  GDAL_VERSION = '1.11'

  WINDSHAFT_VALID_VERSION = '2.12'
  WINDSHAFT_LATEST_VERSION = '2.12.1'
  RUN_WINDSHAFT_INSTRUCTIONS = 'Run Windshaft: <span class="code">cd /Windshaft-cartodb && node app.js development</span>'
  SQL_API_VALID_VERSION = '1.24'
  SQL_API_LATEST_VERSION = '1.24.0'
  RUN_SQL_API_INSTRUCTIONS = 'Run SQL API: <span class="code">cd /CartoDB-SQL-API; node app.js development</span>'
  RUN_RESQUE_INSTRUCTIONS =  'Run Resque: <span class="code">bundle exec script/resque</span>'

  skip_before_filter :browser_is_html5_compliant?, :only => :app_status
  # Don't force org urls
  skip_before_filter :ensure_org_url_if_org_user

  def app_status
    return head(503) if Cartodb.config[:disable_file] && File.exists?(File.expand_path(Cartodb.config[:disable_file]))
    db_ok    = check_db
    redis_ok = check_redis
    api_ok   = true
    head (db_ok && redis_ok && api_ok) ? 200 : 500
  rescue => e
    CartoDB::Logger.info 'status method failed', e.inspect
    head 500
  end

  def app_diagnosis
    return head(400) if Cartodb.config[:cartodb_com_hosted] == false

    @diagnosis = [
      diagnosis_output('Configuration') { configuration_diagnosis() },
      diagnosis_output('Operating System') { single_line_command_version_diagnosis('lsb_release -a', OS_VERSION, 1) },
      diagnosis_output('Ruby') { single_line_command_version_diagnosis('ruby --version', RUBY_BIN_VERSION) },
      diagnosis_output('Node') { single_line_command_version_diagnosis('node --version', NODE_VERSION) },
      diagnosis_output('PostgreSQL') { pg_diagnosis },
      diagnosis_output('PostGIS') { extension_diagnosis('postgis', POSTGIS_VERSION) },
      diagnosis_output('CartoDB extension') { extension_diagnosis('cartodb', CDB_VALID_VERSION, CDB_LATEST_VERSION) },
      diagnosis_output('Database connection') { db_diagnosis },
      diagnosis_output('Redis') { redis_diagnosis },
      diagnosis_output('Redis connection') { redis_connection_diagnosis },
      diagnosis_output('Windshaft', RUN_WINDSHAFT_INSTRUCTIONS) { windshaft_diagnosis(WINDSHAFT_VALID_VERSION, WINDSHAFT_LATEST_VERSION) },
      diagnosis_output('SQL API', RUN_SQL_API_INSTRUCTIONS) { sql_api_diagnosis(SQL_API_VALID_VERSION, SQL_API_LATEST_VERSION) },
      diagnosis_output('Resque') { resque_diagnosis(RUN_RESQUE_INSTRUCTIONS) },
      diagnosis_output('GEOS') { single_line_command_version_diagnosis('geos-config --version', GEOS_VERSION) },
      diagnosis_output('GDAL') { single_line_command_version_diagnosis('gdal-config --version', GDAL_VERSION) },
    ]
  end

  private

  def configuration_diagnosis
    ['', [
      "Environment: #{environment}",
      "Subdomainless URLs: #{Cartodb.config[:subdomainless_urls]}"
    ]]
  end

  def environment
    Rails.env
  end

  def pg_diagnosis
    version_diagnosis(PG_VERSION) {
      version = Rails::Sequel.connection.fetch('select version()').first.values[0]
      [version, [version]]
    }
  end

  def db_diagnosis
    [STATUS[check_db], []]
  end

  def redis_diagnosis
    version_diagnosis(REDIS_VERSION) {
      version = $tables_metadata.info['redis_version']
      [version, [version]]
    }
  end

  def redis_connection_diagnosis
    [STATUS[check_redis], []]
  end

  def windshaft_diagnosis(supported_version, latest_version)
    tiler_url = configuration_url(Cartodb.config[:tiler]['internal'])

    info = JSON.parse(http_client.get("#{tiler_url}/version").body)

    version = info['windshaft_cartodb']
    messages = info.to_a.map {|s, v| "<span class='lib'>#{s}</strong>: <span class='version'>#{v}</span>"}.append("internal url: #{tiler_url}")
    valid = valid?(supported_version, latest_version, version)

    health = JSON.parse(http_client.get("#{tiler_url}/health").body)
    unless health['enabled'] == true
      health['instructions'] = "Enable health checking at config/environments/#{environment}.js"
    end
    health_ok = health['ok'] == true
    messages.concat(health.reject { |k, v| k == 'result' }.to_a.map {|s, v| "<span class='lib'>Health #{s}</strong>: <span class='version'>#{v}</span>"})

    messages << "Currently we support #{supported_version}. Latest: #{latest_version}" unless valid
    [STATUS[response.response_code == 200 && valid && health_ok], messages]
  end

  # true: latest
  # nil: supported
  # false: not supported
  def valid?(supported_version, latest_version, version)
    if (version =~ /\A#{latest_version}/ ? true : nil)
      true
    else
      version =~ /\A#{supported_version}/ ? nil : false
    end
  end

  def sql_api_diagnosis(supported_version, latest_version)
    sql_api_url = configuration_url(Cartodb.config[:sql_api]['private'])
    response = http_client.get("#{sql_api_url}/api/v1/version")
    info = JSON.parse(response.body)
    version = info['cartodb_sql_api']
    messages = info.to_a.map {|s, v| "<span class='lib'>#{s}</strong>: <span class='version'>#{v}</span>"}.append("private url: #{sql_api_url}")
    valid = valid?(supported_version, latest_version, version)
    messages << "Currently we support #{supported_version}. Latest: #{latest_version}" unless valid
    [STATUS[response.response_code == 200 && valid], messages]
  end

  def resque_diagnosis(help)
    Open3.popen3('ps xah | grep "[s]cript/resque"') do |stdin, stdout, stderr, process|
      output = stdout.read
      status = output != nil && output != ''
      messages = output.split("\n")
      [STATUS[status], messages.append(status ? ("Running pids: #{running_import_ids}") : help)]
    end
  end

  def running_import_ids
    Resque::Worker.all.map do |worker|
      next unless worker.job['queue'] == 'imports'
      worker.job['payload']['args'].first['job_id'] rescue nil
    end.compact
  end

  def check_db
    Rails::Sequel.connection.select('OK').first.values.include?('OK')
  end

  def check_redis
    $tables_metadata.dbsize != nil
  end

  def http_client
    @http_client ||= Carto::Http::Client.get('diagnosis')
  end

  def diagnosis_output(title, help = nil)
    [title, safe_diagnosis(help) { yield } ].flatten(1)
  end

  def safe_diagnosis(help = nil)
    yield
  rescue => e
    [ STATUS[false], [ help, e.to_s ].compact ]
  end

  def extension_diagnosis(extension, supported_version, latest_version = nil)
    version = Rails::Sequel.connection.fetch("select default_version from pg_available_extensions where name = '#{extension}'").first.values[0]

    status_and_messages(version, [], supported_version, latest_version)
  end

  def version_diagnosis(supported_version, latest_version = nil)
    version_and_messages = yield
    version = version_and_messages[0]
    messages = version_and_messages[1]
    status_and_messages(version, messages, supported_version, latest_version)
  end

  def status_and_messages(version, messages, supported_version, latest_version)
    valid = version =~ /\A#{supported_version}/ ? true : false
    messages = ["Installed version: #{version}"]
    messages << "Current supported version: #{supported_version}.#{ latest_version.nil? ? '' : "Latest version: #{latest_version}" }" unless valid
    if latest_version && valid
      latest = version =~ /\A#{latest_version}/ ? true : false
      messages << "Latest version: #{latest_version}" unless latest
      [STATUS[latest || 'supported'], messages]
    else
      [STATUS[valid], messages]
    end
  end

  def single_line_command_version_diagnosis(command, supported_version, line_index = 0, latest_version = nil)
    version_diagnosis(supported_version, latest_version) {
      stdin, stdout, stderr, process = Open3.popen3(command)
      output = stdout.read.split("\n")
      if latest_version.nil?
        [output[line_index], output]
      end
    }
  end

  def configuration_url(conf)
    "#{conf['protocol']}://#{conf['domain']}:#{conf['port']}"
  end

end
