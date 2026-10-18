module.exports = {
  appId: 'com.ricenoodle.ballgame',
  productName: '推小球闯关',
  executableName: 'Ballgame',
  directories: { output: 'release', buildResources: 'build' },
  files: ['dist-desktop/**/*', 'electron/**/*', 'build/icon.ico', 'package.json', '!node_modules/**/*'],
  asar: true,
  npmRebuild: false,
  win: {
    icon: 'build/icon.ico',
    target: [{ target: 'nsis', arch: ['x64'] }, { target: 'portable', arch: ['x64'] }],
  },
  nsis: {
    artifactName: '推小球闯关-Setup.${ext}',
    oneClick: false,
    perMachine: false,
    allowElevation: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    deleteAppDataOnUninstall: false,
  },
  portable: { artifactName: '推小球闯关-Portable.${ext}' },
};
