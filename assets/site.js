(function () {
window.MMA = 1;
var d = document.documentElement;
if (!d.classList.contains('js')) {
document.querySelectorAll('[data-in]').forEach(function (el) { el.classList.add('in'); });
d.classList.add('js');
}
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('touchstart', function () {}, { passive: true });
var menu = document.querySelector('.menu');
var hdr = document.querySelector('.site-header');
var behind = document.querySelectorAll('main, .site-footer, .contact-bar, .skip');
function setInert(on) {
behind.forEach(function (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
}
function sheetIsModal() { return window.innerWidth < 900; }
function closeMenu(focusBack) {
if (!menu || !menu.open || menu.classList.contains('closing')) return;
var done = function () {
menu.classList.remove('closing');
menu.open = false;
if (focusBack) menu.querySelector('summary').focus({ preventScroll: true });
};
if (reduce) { done(); return; }
var sheet = menu.querySelector('.sheet');
var cs = getComputedStyle(sheet), m = /matrix\(([^)]+)\)/.exec(cs.transform || '');
sheet.style.setProperty('--o', cs.opacity);
sheet.style.setProperty('--y', (m ? parseFloat(m[1].split(',')[5]) || 0 : 0) + 'px');
menu.classList.add('closing');
var t = setTimeout(done, 320);                       // the exit is 0.22 s; never left half-closed
sheet.addEventListener('animationend', function f(e) {
if (e.target !== sheet) return;
sheet.removeEventListener('animationend', f); clearTimeout(t); done();
});
}
if (menu) {
menu.querySelector('summary').addEventListener('click', function (e) {
if (menu.open) { e.preventDefault(); closeMenu(false); }
});
menu.addEventListener('toggle', function () {
setInert(menu.open && sheetIsModal());
if (menu.open && hdr) hdr.classList.remove('away');
if (darks.length) tone();
});
document.addEventListener('click', function (e) {
if (!menu.open) return;
if (!menu.contains(e.target)) closeMenu(false);
});
var sheetEl = menu.querySelector('.sheet');
sheetEl.addEventListener('click', function (e) {
if (e.target === sheetEl) closeMenu(false);
});
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && menu.open) closeMenu(true);
});
document.addEventListener('focusin', function (e) {
var keep = sheetIsModal() ? hdr : menu;
if (menu.open && !keep.contains(e.target)) closeMenu(false);
});
}
function headerHeld() {
try { return !!hdr.querySelector(':focus-visible'); } catch (e) { return hdr.contains(document.activeElement); }
}
var lastY = window.scrollY;
function headerStep() {
var y = window.scrollY, dy = y - lastY;
if (dy > 0 ? dy < 10 : dy > -24) return;
hdr.classList.toggle('away', dy > 0 && y > 140 && window.innerWidth < 900 && !(menu && menu.open) && !headerHeld());
lastY = y;
}
var film = document.querySelector('.film'), stage = film && film.querySelector('.film-stage');
var beats = film ? film.querySelectorAll('h2, .film-line') : [], beatOn = -2;
function filmStep() {
var r = film.getBoundingClientRect(), hold = r.height - stage.offsetHeight;
var p = hold > 0 ? -r.top / hold : 0;
var k = r.top > 40 ? -1 : p < 0.22 ? 0 : p < 0.48 ? 1 : p < 0.74 ? 2 : 3;   // 40 px before the hold: the title's foot is clear of the bar by then
if (k === beatOn) return;
beatOn = k;
for (var i = 0; i < beats.length; i++) {
beats[i].classList.toggle('is-on', i === k);
beats[i].classList.toggle('is-past', i < k);
}
}
if (film && stage && beats.length === 4) film.classList.add('steps'); else film = null;
var darks = document.querySelectorAll('.film, .page-hero.dark, .tile.dark');
var cbar = document.querySelector('.contact-bar'), tint = document.querySelector('meta[name="theme-color"]');
function darkAt(y) {
var x = window.innerWidth / 2;
for (var i = 0; i < darks.length; i++) {
var r = darks[i].getBoundingClientRect();
if (r.top <= y && r.bottom >= y && r.left <= x && r.right >= x) {
var card = darks[i].querySelector('.receipt');
return !(card && card.getBoundingClientRect().top <= y);
}
}
return false;
}
function tone() {
var hy = hdr ? hdr.offsetHeight / 2 : 28;
var top = darkAt(hy), low = false;
if (cbar) {
var b = cbar.getBoundingClientRect(), by = b.top + b.height * 0.7;
low = b.height > 0 && darkAt(by);
cbar.classList.toggle('on-dark', low);
}
if (hdr) hdr.classList.toggle('on-dark', top);
if (tint) tint.setAttribute('content', top && !(menu && menu.open) ? '#1d1d1f' : '#f5f5f7');   // the open sheet is light
}
var ticking = false;
function frame() {
ticking = false;
if (hdr) headerStep();
if (film) filmStep();
if (darks.length) tone();
}
window.addEventListener('scroll', function () {
if (!ticking) { ticking = true; requestAnimationFrame(frame); }
}, { passive: true });
if (hdr) hdr.addEventListener('focusin', function () { if (headerHeld()) hdr.classList.remove('away'); });
if (film) filmStep();
if (darks.length) tone();
function layout() {
document.querySelectorAll('.timeline').forEach(function (tl) {
var r = tl.getBoundingClientRect();
var across = getComputedStyle(tl).gridTemplateColumns.split(' ').length > 1;
var lis = tl.querySelectorAll('li');
if (!lis.length) return;
var dot = getComputedStyle(lis[0], '::before');
var half = (parseFloat(dot.height) || 16) / 2;
var at = function (li) {
var b = li.getBoundingClientRect();
return across ? (b.left - r.left) + half : (b.top - r.top) + (parseFloat(dot.top) || 0) + half - 10;
};
var len = Math.max(1, at(lis[lis.length - 1]));
tl.style.setProperty('--len', len.toFixed(1) + 'px');
lis.forEach(function (li) {
li.style.setProperty('--f', Math.max(0, Math.min(1, at(li) / len)).toFixed(3));
});
});
}
layout();
var queued = false;
window.addEventListener('resize', function () {
if (queued) return;
queued = true;
requestAnimationFrame(function () { queued = false; layout(); frame(); if (menu && menu.open) setInert(sheetIsModal()); });
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
var filmPic = film && film.querySelector('.film-pic img');
if (filmPic) {
var wake = function () { setTimeout(function () { filmPic.loading = 'eager'; }, 400); };
if (document.readyState === 'complete') wake(); else window.addEventListener('load', wake);
}
var marked = document.querySelectorAll('[data-in]');
if (!('IntersectionObserver' in window)) {
marked.forEach(function (el) { el.classList.add('in'); });
if (cbar) cbar.classList.add('set');
if (hdr) hdr.classList.add('call-set');
return;
}
var top = document.getElementById('top-sentinel');
if (hdr && top) {
new IntersectionObserver(function (es) { hdr.classList.toggle('scrolled', !es[0].isIntersecting); }).observe(top);
}
var pill = document.querySelector('.hero-lead .actions .button');
if (pill && (cbar || hdr)) {
new IntersectionObserver(function (es) {
var seen = es[0].isIntersecting;
if (cbar) { cbar.classList.toggle('quiet', seen); cbar.classList.add('set'); }
if (hdr) { hdr.classList.toggle('call-rest', seen); hdr.classList.add('call-set'); }
}, { rootMargin: '0px 0px -80px 0px' }).observe(pill);
} else {
if (cbar) cbar.classList.add('set');
if (hdr) hdr.classList.add('call-set');
}
if (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent || '')) {
document.querySelectorAll('.place-tap[data-apple]').forEach(function (a) { a.href = a.getAttribute('data-apple'); });
}
var io = new IntersectionObserver(function (es) {
es.forEach(function (e) {
if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
});
}, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
marked.forEach(function (el) { io.observe(el); });
})();
