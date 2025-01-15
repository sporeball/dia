let active_slide = 1;
let num_slides = document.querySelectorAll('.dia-slide').length;

document.getElementById('dia-slide-1').classList.add('dia-active');

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
    if (active_slide > 1) {
      document.getElementById(`dia-slide-${active_slide}`).classList.remove('dia-active');
      document.getElementById(`dia-slide-${--active_slide}`).classList.add('dia-active');
    }
  }
  if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
    if (active_slide < num_slides) {
      document.getElementById(`dia-slide-${active_slide}`).classList.remove('dia-active');
      document.getElementById(`dia-slide-${++active_slide}`).classList.add('dia-active');
    }
  }
})