const { ipcRenderer } = require('electron');
const ProgressBar = require('progressbar.js');
const path = require('path');

const bar = new ProgressBar.Line('#bar', {
  strokeWidth: 6,
  easing: 'easeInOut',
  duration: 1400,
  color: '#2bbbad',
  trailColor: '#b2dfdb',
  trailWidth: 6,
  svgStyle: { width: '100%', height: '100%' },
  step: (state, barObj) => {
    const step = `${Math.round(barObj.value() * 100)}%`;
    barObj.setText(step);
  },
});

bar.text.style.color = '#fff';
bar.text.style.marginTop = '-1%';
bar.text.style.marginLeft = '4.5%';

const startEl = document.getElementById('start');

ipcRenderer.on('message', (e, { type: messageType, data }) => {
  if (messageType === 'start') {
    startEl.className += ' disabled';
  }
  if (messageType === 'process') {
    bar.animate(data, {
      duration: 50,
    });
  }
  if (messageType === 'end') {
    startEl.className = startEl.className.replace(' disabled', '');
    window.alert('Conversão relizada com sucesso!');
    bar.animate(0);
  }
  if (messageType === 'null') {
    startEl.className = startEl.className.replace(' disabled', '');
    window.alert('Nenhuma nota foi encontrada no diretório');
    bar.animate(0);
  }
});

startEl.onclick = () => {
  const pastaEl = document.getElementById('pasta');
  const folder = path.normalize(pastaEl.files[0].path);

  ipcRenderer.send('toProcessor', { type: 'start', data: folder });
};
