/*
  dia.js
  main script for built slide decks
  copyright (c) 2025 sporeball
  MIT license
*/

let active_slide;
let num_slides = document.querySelectorAll('.dia-slide').length;
let urlParameters = new URLSearchParams(window.location.search);

function set_slide(index) {
  active_slide = index;
  if (document.querySelector('.dia-active') !== null) {
    document.querySelector('.dia-active').classList.remove('dia-active');
  }
  document.getElementById(`dia-slide-${active_slide}`).classList.add('dia-active');
  let progress_width = ((active_slide - 1) / (num_slides - 1)) * 100;
  document.getElementById('dia-progress').style.width = `${progress_width}%`;
  urlParameters.set('slide', active_slide);
  window.history.pushState({}, '', `${window.location.pathname}?${urlParameters.toString()}`);
}

window.addEventListener('DOMContentLoaded', e => {
  let active_slide_param = urlParameters.get('slide');
  if (active_slide_param === null) {
    set_slide(1);
  } else {
    set_slide(Number(active_slide_param));
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
    if (active_slide > 1) {
      set_slide(--active_slide);
    }
  }
  if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
    if (active_slide < num_slides) {
      set_slide(++active_slide);
    }
  }
});

