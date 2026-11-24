/** How long the loading intro runs (keep in sync with the `intro-*` keyframes in globals.css). */
export const INTRO_SECONDS = 2.6;

const REPLAY_AFTER_MS = 10 * 60 * 1000;

// Runs while the HTML is parsed, before the first paint: decides whether the intro plays
// (first visit, any reload, or back after 10+ minutes) and marks <html> accordingly. The intro
// ends when its fade-out animation finishes (with a timer as a safety net).
export const introScript = `(function(){var d=document.documentElement;try{
if(location.pathname.indexOf("/admin")===0){d.dataset.intro="skip";return}
var k="markson-intro",last=Number(localStorage.getItem(k)||0),
nav=performance.getEntriesByType("navigation")[0],reload=nav&&nav.type==="reload",
calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!calm&&(reload||Date.now()-last>${REPLAY_AFTER_MS})){
localStorage.setItem(k,String(Date.now()));d.dataset.intro="play";window.__introStart=performance.now();
var end=function(){d.dataset.intro="done";document.removeEventListener("animationend",onEnd)};
var onEnd=function(e){if(e.animationName==="intro-screen-out")end()};
document.addEventListener("animationstart",function s(e){if(e.animationName==="intro-line-in"){window.__introStart=performance.now();document.removeEventListener("animationstart",s)}});
document.addEventListener("animationend",onEnd);
setTimeout(end,${INTRO_SECONDS * 1000 + 4000});
}else{d.dataset.intro="skip"}
}catch(e){d.dataset.intro="skip"}})()`;

declare global {
  interface Window {
    __introStart?: number;
    __introEndTimer?: number;
  }
}

export function playIntro() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  window.clearTimeout(window.__introEndTimer);
  window.__introStart = performance.now();
  root.dataset.intro = "play";
  window.__introEndTimer = window.setTimeout(() => {
    root.dataset.intro = "done";
  }, INTRO_SECONDS * 1000);
}

/**
 * Seconds a hero entrance should wait so it starts as the intro finishes (0 when the intro
 * isn't playing, e.g. returning visitors or later in-site navigations).
 */
export function introDelay() {
  if (typeof document === "undefined" || document.documentElement.dataset.intro !== "play") return 0;
  const elapsed = (performance.now() - (window.__introStart ?? performance.now())) / 1000;
  return Math.max(0, INTRO_SECONDS - 0.5 - elapsed);
}
