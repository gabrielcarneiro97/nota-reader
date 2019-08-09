const { ipcRenderer } = require('electron');
const ProgressBar = require('progressbar.js');

const bar = new ProgressBar.Line('#bar', {
  strokeWidth: 6,
  easing: 'easeInOut',
  duration: 1400,
  color: '#2bbbad',
  trailColor: '#b2dfdb',
  trailWidth: 6,
  svgStyle: { width: '100%', height: '100%' },
  step: (state, barObj) => {
    const step = `${Math.round(bar.value() * 100)}%`;
    barObj.setText(step);
  },
});

bar.text.style.color = '#fff';
bar.text.style.marginTop = '-1%';
bar.text.style.marginLeft = '4.5%';

ipcRenderer.on('message', (e, m) => {
  if (m.type === 'start') {
    document.getElementById('start').className += ' disabled';
  }
  if (m.type === 'process') {
    bar.animate(m.data, {
      duration: 50,
    });
  }
  if (m.type === 'end') {
    document.getElementById('start').className = document.getElementById('start').className.replace(' disabled', '');
    window.alert('Conversão relizada com sucesso!');
    bar.animate(0);
  }
  if (m.type === 'null') {
    document.getElementById('start').className = document.getElementById('start').className.replace(' disabled', '');
    window.alert('Nenhuma nota foi encontrada no diretório');
    bar.animate(0);
  }
});

const e = document.getElementById('start');
e.onclick = () => {
  const path = document.getElementById('pasta').files[0].path.replace(/\\/g, '/');

  ipcRenderer.send('toProcessor', { type: 'start', data: path });
};
