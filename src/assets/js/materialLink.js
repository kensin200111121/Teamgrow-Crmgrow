document.addEventListener('click', function (e) {
  const target = e.target.closest('.material-object');
  if (target) {
    e.preventDefault();
    e.stopPropagation();
    const dataType = target.getAttribute('data-type');
    const dataId = target.getAttribute('href').replace(/{{|}}/g, '');
    const url = `${window['environment'].website}/${dataType}/${dataId}`;
    window.open(url, '_blank');
  }
});

document.addEventListener('click', function (e) {
  const target = e.target.closest('.landing-page-object');
  if (target) {
    e.preventDefault();
    e.stopPropagation();
    if (target.getAttribute('data-no-edit') === 'true') {
      return;
    }
    const dataId = target.getAttribute('href').replace(/{{|}}/g, '');
    const url = `${window['environment'].website}/page/${dataId}`;
    window.open(url, '_blank');
  }
});
