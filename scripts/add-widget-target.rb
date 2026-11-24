# Adds the widget extension (ios/App/TimesbaneWidgets) to the Xcode project and embeds it in the app.
# Runs on the CI Mac before archiving (there is no Xcode on Windows to add a target with); safe to run again.
# Needs the xcodeproj gem: `gem install xcodeproj`.
require 'xcodeproj'

project_path = File.join(__dir__, '..', 'ios', 'App', 'App.xcodeproj')
project = Xcodeproj::Project.open(project_path)
if project.targets.any? { |t| t.name == 'TimesbaneWidgets' }
  puts 'widget target already present'
  exit 0
end
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'
version = app.build_configurations.first.build_settings['MARKETING_VERSION'] || '1.0'

widget = project.new_target(:app_extension, 'TimesbaneWidgets', :ios, '17.0', nil, :swift)
group = project.main_group.new_group('TimesbaneWidgets', 'TimesbaneWidgets')
sources = Dir[File.join(__dir__, '..', 'ios', 'App', 'TimesbaneWidgets', '*.swift')].sort.map { |f| group.new_reference(File.basename(f)) }
abort 'no widget sources' if sources.empty?
widget.add_file_references(sources)
group.new_reference('Info.plist')

widget.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.mediavanity.timesbane.widgets'
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'TimesbaneWidgets/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SWIFT_VERSION'] = '5.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
  s['MARKETING_VERSION'] = version
  s['CURRENT_PROJECT_VERSION'] = '1'
  s['SKIP_INSTALL'] = 'YES'
  s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
end
widget.add_system_framework(%w[WidgetKit SwiftUI])

app.add_dependency(widget)
embed = app.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' } || app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
file = embed.add_file_reference(widget.product_reference, true)
file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts "added the widget target (version #{version})"
