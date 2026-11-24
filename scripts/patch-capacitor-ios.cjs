// Patches a fresh Capacitor 8 iOS project (after `npx cap add ios`) the way both shipped apps needed:
//  - iOS 16 minimum (the template says 15.0 in four places)
//  - UIRequiredDeviceCapabilities arm64 (the template still says armv7)
//  - ITSAppUsesNonExemptEncryption false (skips the export-compliance question on every build)
//  - adds PrivacyInfo.xcprivacy to Resources and an extra Swift file (your plugin) to Sources, so neither needs Xcode
// Usage: node patch-capacitor-ios.cjs ios/App [PluginFile.swift]
// Idempotent; throws if the template changed shape, so you notice instead of shipping a half-patched project.
// Then copy assets/PrivacyInfo.xcprivacy and your Swift file into ios/App/App/.
const fs = require('fs'), path = require('path');
const app = process.argv[2], swift = process.argv[3];
if (!app) throw new Error('usage: node patch-capacitor-ios.cjs ios/App [PluginFile.swift]');
const pbxPath = path.join(app, 'App.xcodeproj', 'project.pbxproj');
let p = fs.readFileSync(pbxPath, 'utf8');
const once = (a, b) => { const n = p.split(a).length - 1; if (n !== 1) throw new Error(`pbxproj: expected 1, found ${n}: ${a.slice(0, 70)}`); p = p.replace(a, b); };

p = p.replace(/IPHONEOS_DEPLOYMENT_TARGET = 1[0-5]\.0;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;');
if ((p.match(/IPHONEOS_DEPLOYMENT_TARGET = 16\.0;/g) || []).length !== 4) throw new Error('expected 4 deployment-target lines');

// Fixed object IDs (24 hex characters), unique enough for one project.
const PB = '5A7D00000000000000000001', PF = '5A7D00000000000000000002', SB = '5A7D00000000000000000003', SF = '5A7D00000000000000000004';
const sceneRef = (p.match(/\t\t\t\t(\w{24}) \/\* SceneDelegate\.swift \*\/,\n/) || [])[0];
const sceneBuild = (p.match(/\t\t\t\t(\w{24}) \/\* SceneDelegate\.swift in Sources \*\/,\n/) || [])[0];
const publicBuild = (p.match(/\t\t\t\t(\w{24}) \/\* public in Resources \*\/,\n/) || [])[0];
if (!sceneRef || !sceneBuild || !publicBuild) throw new Error('template layout changed: SceneDelegate/public entries not found');

if (!p.includes('PrivacyInfo.xcprivacy')) {
  once('/* End PBXBuildFile section */', `\t\t${PB} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${PF} /* PrivacyInfo.xcprivacy */; };\n/* End PBXBuildFile section */`);
  once('/* End PBXFileReference section */', `\t\t${PF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n/* End PBXFileReference section */`);
  once(sceneRef, `${sceneRef}\t\t\t\t${PF} /* PrivacyInfo.xcprivacy */,\n`);
  once(publicBuild, `${publicBuild}\t\t\t\t${PB} /* PrivacyInfo.xcprivacy in Resources */,\n`);
}
if (swift && !p.includes(`/* ${swift} */`)) {
  once('/* End PBXBuildFile section */', `\t\t${SB} /* ${swift} in Sources */ = {isa = PBXBuildFile; fileRef = ${SF} /* ${swift} */; };\n/* End PBXBuildFile section */`);
  once('/* End PBXFileReference section */', `\t\t${SF} /* ${swift} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ${swift}; sourceTree = "<group>"; };\n/* End PBXFileReference section */`);
  once(sceneRef, `${sceneRef}\t\t\t\t${SF} /* ${swift} */,\n`);
  once(sceneBuild, `${sceneBuild}\t\t\t\t${SB} /* ${swift} in Sources */,\n`);
}
fs.writeFileSync(pbxPath, p);

const plPath = path.join(app, 'App', 'Info.plist');
let pl = fs.readFileSync(plPath, 'utf8');
pl = pl.replace('<string>armv7</string>', '<string>arm64</string>');
if (!pl.includes('ITSAppUsesNonExemptEncryption'))
  pl = pl.replace('\t<key>LSRequiresIPhoneOS</key>', '\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n\t<key>LSRequiresIPhoneOS</key>');
if (!pl.includes('ITSAppUsesNonExemptEncryption')) throw new Error('Info.plist: could not add ITSAppUsesNonExemptEncryption');
fs.writeFileSync(plPath, pl);
console.log('Patched: iOS 16, arm64, encryption flag, PrivacyInfo.xcprivacy' + (swift ? `, ${swift}` : ''));
