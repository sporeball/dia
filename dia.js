let active_slide;
let num_slides = document.querySelectorAll('.dia-slide').length;
let urlParameters = new URLSearchParams(window.location.search);

window.addEventListener('DOMContentLoaded', e => {
  let active_slide_param = urlParameters.get('slide');
  if (active_slide_param === null) {
    active_slide = 1;
    urlParameters.set('slide', active_slide);
    window.location.search = urlParameters;
  } else {
    active_slide = Number(active_slide_param);
  }
  document.getElementById(`dia-slide-${active_slide}`).classList.add('dia-active');
  let progress_width = ((active_slide - 1) / (num_slides - 1)) * 100;
  document.getElementById('dia-progress').style.width = `${progress_width}%`;
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
    if (active_slide > 1) {
      document.getElementById(`dia-slide-${active_slide}`).classList.remove('dia-active');
      document.getElementById(`dia-slide-${--active_slide}`).classList.add('dia-active');
      urlParameters.set('slide', active_slide);
      window.location.search = urlParameters;
      let progress_width = ((active_slide - 1) / (num_slides - 1)) * 100;
      document.getElementById('dia-progress').style.width = `${progress_width}%`;
    }
  }
  if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
    if (active_slide < num_slides) {
      document.getElementById(`dia-slide-${active_slide}`).classList.remove('dia-active');
      document.getElementById(`dia-slide-${++active_slide}`).classList.add('dia-active');
      urlParameters.set('slide', active_slide);
      window.location.search = urlParameters;
      let progress_width = ((active_slide - 1) / (num_slides - 1)) * 100;
      document.getElementById('dia-progress').style.width = `${progress_width}%`;
    }
  }
});

