let active_slide;
let num_slides = document.querySelectorAll('.dia-slide').length;
let urlParameters = new URLSearchParams(window.location.search);

window.addEventListener('DOMContentLoaded', e => {
  active_slide = urlParameters.get('slide');
  if (active_slide === null) {
    active_slide = 1;
    urlParameters.set('slide', active_slide);
    window.location.search = urlParameters;
  }
  document.getElementById(`dia-slide-${active_slide}`).classList.add('dia-active');
  document.getElementById('dia-slide-index').innerHTML = `${active_slide} / ${num_slides}`;
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
    if (active_slide > 1) {
      document.getElementById(`dia-slide-${active_slide}`).classList.remove('dia-active');
      document.getElementById(`dia-slide-${--active_slide}`).classList.add('dia-active');
      urlParameters.set('slide', active_slide);
      window.location.search = urlParameters;
      document.getElementById('dia-slide-index').innerHTML = `${active_slide} / ${num_slides}`;
    }
  }
  if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
    if (active_slide < num_slides) {
      document.getElementById(`dia-slide-${active_slide}`).classList.remove('dia-active');
      document.getElementById(`dia-slide-${++active_slide}`).classList.add('dia-active');
      urlParameters.set('slide', active_slide);
      window.location.search = urlParameters;
      document.getElementById('dia-slide-index').innerHTML = `${active_slide} / ${num_slides}`;
    }
  }
});

