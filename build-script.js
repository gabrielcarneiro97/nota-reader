const packager = require('electron-packager');
const electronInstaller = require('electron-winstaller');

async function bundleElectronApp() {
  try {
    const appPaths = await packager({
      arch: 'ia32',
      platform: 'win32',
      executableName: 'NFS-e BH Conversor',
      overwrite: true,
      dir: './',
      out: './out',
    });
    console.log(`Electron app bundles created:\n${appPaths.join('\n')}`);

    await electronInstaller.createWindowsInstaller({
      appDirectory: './out/nota_reader-win32-ia32',
      outputDirectory: './out/installer',
      authors: 'Gabriel Carneiro',
      exe: 'NFS-e BH Conversor.exe',
      noMsi: true,
      setupExe: 'nota-reader-setup.exe',
    });
    console.log('It worked!');
  } catch (err) {
    console.error(err);
  }
}

bundleElectronApp();
