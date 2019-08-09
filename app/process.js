const path = require('path');
const timer = require('timers');
const { ipcRenderer } = require('electron');

const pdf = require(path.join(__dirname, '/../pdfCreator.js')); // eslint-disable-line

ipcRenderer.on('message', async (e, m) => {
  if (m.type === 'start') {
    const folder = m.data;

    ipcRenderer.send('toUi', { type: 'start' });
    try {
      const pdfs = await pdf.readDir(folder, (status) => {
        const percent = status.now / status.total;
        ipcRenderer.send('toUi', { type: 'process', data: percent });
      });

      if (pdfs) {
        timer.setTimeout(() => {
          ipcRenderer.send('toUi', { type: 'end' });
        }, 1000);
      } else {
        ipcRenderer.send('toUi', { type: 'null' });
      }
    } catch (err) {
      throw err;
    }
  }
});
