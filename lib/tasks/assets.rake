namespace :assets do
  desc 'Copy digest assets files to non-digest files'
  task :copy_non_digest_files do
    manifest = File.read("#{Rails.root}/public/assets/manifest.yml")
    manifest.each_line do |asset|
      if asset.include?(':')
        non_digest = asset.gsub(' ', '').split(':')[0].strip
        digest = asset.gsub(' ', '').split(':')[1].strip
        FileUtils.cp "#{Rails.root}/public/assets/#{digest}", "#{Rails.root}/public/assets/#{non_digest}"
      end
    end
  end
end
