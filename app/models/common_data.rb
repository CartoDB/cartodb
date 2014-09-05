class CommonData

  DATASETS_JSON_FILENAME = 'datasets.json'

  def initialize
    @datasets = nil
    @user = nil
  end

  def datasets
    if @datasets.nil?

      _datasets = datasets_fallback

      if is_enabled
        _datasets = get_datasets(get_datasets_json(datasets_end_url), datasets_fallback)
      end

      @datasets = _datasets
    end

    @datasets
  end

  def upload_datasets_to_s3(all_public)
    begin
      datasets_json = get_datasets_json(datasets_api_url(false))
      _datasets = get_datasets(datasets_json, [])
    rescue
      puts 'Unable to retrieve datasets, ending now without uploading anything to Amazon S3'
      return
    end

    assets_to_upload(_datasets, all_public) { |asset|
      dataset = asset[:dataset]
      table_name = asset[:table_name]
      body = asset[:body]
      retries = 0
      begin
        retries += 1
        url = CommonData.upload_to_s3("#{table_name}.zip", body[])
        puts "#{table_name} was uploaded to #{url}"
        make_vis_public(dataset)
      rescue
        if retries >= RETRIES_NUMBER
          puts "#{table_name} failed to upload. Updating table metadata"
          # After all retries we update the updated_at so table will get processed again
          update_table_updated_at(table_name)
        else
          sleep RETRIES_SLEEP
          retry
        end
      end
    }

    retries = 0
    begin
      retries += 1
      url = CommonData.upload_to_s3(DATASETS_JSON_FILENAME, datasets_json)
      puts "#{DATASETS_JSON_FILENAME} was uploaded to #{url}"
    rescue => e
      if retries >= RETRIES_NUMBER
        puts "Failed to upload #{DATASETS_JSON_FILENAME}"
      else
        puts e
        sleep RETRIES_SLEEP
        retry
      end
    end
  end

  private

  RETRIES_NUMBER = 3
  RETRIES_SLEEP = 2

  def get_datasets(json, default)
    begin
      _datasets = JSON.parse(json).fetch('visualizations', default)
    rescue
      _datasets = default
    end
    _datasets
  end

  def get_datasets_json(url)
    body = nil
    begin
      response = Typhoeus.get(url, followlocation:true)
      if response.code == 200
        body = response.response_body
      end
    rescue
      body = nil
    end
    body
  end

  def make_vis_public(visualization)
    # /api/v1/viz/:id
    unless visualization['privacy'].downcase == CartoDB::Visualization::Member::PRIVACY_PUBLIC
      puts 'make_vis_public(vis_id)'
    #   vis.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC
    #   vis.save
    #   puts "Privacy in table #{table_name} was set to PUBLIC"
    end
  end

  def update_table_updated_at(table_name)
    puts 'update_table_updated_at(table_name)'
    # /api/v1/tables/:id
  end

  def assets_to_upload(_datasets, all_public)
    datasets_to_generate(_datasets, all_public).each { |dataset|
      table_name = dataset['table']['name']
      yield({ :dataset => dataset, :table_name => table_name, :body => lambda { get_asset table_name } })
    }
  end

  def self.upload_to_s3(filename, body)
    s3_obj = s3_bucket.objects[filename]

    s3_obj.write({
      :data => body,
      :acl => :public_read
    })
    s3_obj.public_url.to_s
  end

  def self.s3_bucket
    AWS.config(Cartodb.config[:aws]["s3"])
    s3 = AWS::S3.new
    bucket_name = Cartodb.config[:common_data]["s3_bucket_name"]
    s3.buckets[bucket_name]
  end

  def get_asset(table_name)
    response = Typhoeus.get(export_url(table_name), followlocation:true)
    raise URI::InvalidURIError unless response.code == 200
    response.response_body
  end

  def datasets_to_generate(_datasets, all_public=false)
    tagged_datasets = _datasets.select { |dataset|
      !dataset['tags'].empty?
    }
    private_datasets = tagged_datasets.select { |dataset|
      dataset['privacy'].downcase == CartoDB::Visualization::Member::PRIVACY_PRIVATE.downcase
    }
    public_datasets = tagged_datasets.select { |dataset|
      dataset['privacy'].downcase == CartoDB::Visualization::Member::PRIVACY_PUBLIC.downcase
    }

    unless all_public
      public_datasets = public_datasets.select { |dataset|
        Time.now.utc - Time.parse(dataset['table']['updated_at']) < config('generate_every', 86400)
      }
    end

    private_datasets + public_datasets
  end

  def base_url
    "#{config('protocol', 'https')}://#{config('username')}.#{config('host')}/api/v1"
  end

  def datasets_end_url
    "https://s3.amazonaws.com/#{config('s3_bucket_name')}/#{DATASETS_JSON_FILENAME}"
  end

  def visualization_api_url(visualization)
    "#{base_url}/viz/#{visualization['id']}?api_key=#{config('api_key')}"
  end

  def table_api_url(table_name)
    "#{base_url}/tables/#{table_name}?api_key=#{config('api_key')}"
  end

  def datasets_api_url(only_public=true)
    privacy = only_public ? '&privacy=public' : ''
    "#{base_url}/viz?page=1&per_page=500&type=table#{privacy}&exclude_shared=true&api_key=#{config('api_key')}"
  end

  def export_url(table_name)
    sql_api_url(table_name)
  end

  def sql_api_url(table_name)
    "#{base_url}/sql?api_key=#{config('api_key')}&format=#{config('format', 'shp')}&filename=#{table_name}&q=#{URI::encode export_query(table_name)}"
  end

  def export_query(table_name)
    "select * from #{table_name}"
  end

  def is_enabled
    !config('username').nil? && !config('api_key').nil?
  end

  def config(key, default=nil)
    if Cartodb.config[:common_data].present?
      Cartodb.config[:common_data][key].present? ? Cartodb.config[:common_data][key] : default
    else
      default
    end
  end

  def datasets_fallback
    !Rails.env.development? ? [] :
        [
            {
                :id => 'wadus-wadus-wadus-wadus-wadus',
                :name => 'table_50m_urban_area',
                :tags => [
                    'Cultural datasets'
                ],
                :description => '',
                :privacy => 'PUBLIC',
                :created_at => '2014-08-28T07:27:34+00:00',
                :updated_at => '2014-08-28T13:01:36+00:00',
                :source => nil,
                :title => nil,
                :license => nil,
                :table => {
                    :id => 'wadus-wadus-wadus-wadus-wadus',
                    :name => 'table_50m_urban_area',
                    :privacy => 'PUBLIC',
                    :updated_at => '2014-08-28T12:43:45+00:00',
                    :size => 1028096,
                    :row_count => 2143
                },
            }
        ]
  end

end
