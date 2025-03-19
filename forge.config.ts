import { ForgeConfig } from '@electron-forge/shared-types';
import * as path from 'path';

const config: ForgeConfig = {
    packagerConfig: {
        // Application name
        name: "Pushover Desktop",
        // Application executable name
        executableName: "pushover-desktop",
        // App copyright
        appCopyright: `Copyright © ${new Date().getFullYear()}`,
        // Icon locations (create these icons before packaging)
        icon: path.resolve(__dirname, 'assets', 'icon'),
        // Application identifier
        appBundleId: "com.crispyybaconx.pushover-desktop",
        // Asar packaging
        asar: true,
        // Files to ignore when packaging
        ignore: [
            /^\/src/,
            /\.ts$/,
            /^\/\.git/,
            /^\/\.vscode/,
            /^\/forge\.config\.ts/,
            /^\/tsconfig\.json/,
            /^\/README\.md/
        ],
    },
    // Configuration for generating different package formats
    makers: [
        // Windows installer
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                // Windows installer configuration
                name: 'pushover-desktop',
                // Application icon
                iconUrl: path.resolve(__dirname, 'assets', 'icon.ico'),
                setupIcon: path.resolve(__dirname, 'assets', 'icon.ico'),
            },
        },
        // macOS DMG
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
            config: {
                name: 'pushover-desktop',
                icon: path.resolve(__dirname, 'assets', 'icon.png'),
            },
        },
        // Linux DEB package
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    // Linux package maintainer
                    maintainer: 'CrispyyBaconx',
                    // Application homepage
                    homepage: 'https://github.com/CrispyyBaconx/pushover-desktop',
                    // Linux icon
                    icon: path.resolve(__dirname, 'assets', 'icon.png'),
                },
            },
        },
        // Linux RPM package
        {
            name: '@electron-forge/maker-rpm',
            config: {
                options: {
                    // Linux package maintainer
                    maintainer: 'CrispyyBaconx',
                    // Application homepage
                    homepage: 'https://github.com/CrispyyBaconx/pushover-desktop',
                    // Linux icon
                    icon: path.resolve(__dirname, 'assets', 'icon.png'),
                },
            },
        },
    ],
    // Optional: Plugins
    plugins: [
        // Auto-unpack native modules
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
    ],
    // GitHub releases configuration
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'CrispyyBaconx',
                    name: 'pushover-desktop'
                },
                // Set to true for beta releases
                prerelease: false,
                // Optional: Draft releases (requires manual publishing on GitHub)
                draft: false,
                // Optional: Customize the release name
                tagPrefix: 'v',
                // Optional: Add release notes from a file
                // releaseNotes: fs.readFileSync(path.resolve(__dirname, './RELEASE_NOTES.md'), 'utf8'),
            }
        }
    ]
};

export default config;