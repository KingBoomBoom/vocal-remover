const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('assets/affiliate-offers.js', 'utf8');
function setup(enabled = true, overrides = {}) {
  let clock = 0, timers = new Map(), seq = 0, observer, cb;
  const events = [], listeners = {};
  const slot = { dataset: { offerSlot: 'test_offer' }, appendChild(card) { this.card = card; } };
  const document = { visibilityState: 'visible', querySelectorAll: () => [slot], createElement: () => ({ append(...children) { this.children = children; }, addEventListener(k,f) { this[k] = f; } }), addEventListener(k,f) { listeners[k] = f; }, removeEventListener(k) { delete listeners[k]; } };
  const pageEvents = {};
  const window = { cleanStemsOffers: { lalal: { enabled, payoutConfirmed: true, url: 'https://www.lalal.ai/?referral=actual-test-fixture', ...overrides } }, cleanStemsTrack: (...e) => events.push(e), addEventListener(k,f) { pageEvents[k]=f; }, IntersectionObserver: function(f) { cb=f; observer=this; this.observe=()=>{}; this.disconnect=()=>{this.disconnected=true;}; } };
  vm.runInNewContext(code, { window, document, URL, Set, location:{pathname:'/test/'}, IntersectionObserver: window.IntersectionObserver, setTimeout(f,ms) { timers.set(++seq,{f,at:clock+ms}); return seq; }, clearTimeout(id) { timers.delete(id); } });
  return {slot, events, document, listeners, pageEvents, visible(r) { cb([{isIntersecting:r>0,intersectionRatio:r}]); }, advance(ms) { clock+=ms; for(const [id,t] of [...timers]) if(t.at<=clock) { timers.delete(id); t.f(); } }};
}
assert.equal(setup(false).slot.card, undefined, 'disabled config must render nothing');
for (const overrides of [{payoutConfirmed:false},{url:''},{url:'https://lalal.ai.evil.example/'},{url:'http://www.lalal.ai/'},{url:'https://user:password@www.lalal.ai/'},{url:'https://www.lalal.ai/?ref=YOUR_ID'}]) {
  assert.equal(setup(true,overrides).slot.card,undefined,'unapproved or invalid configurations must stay invisible');
}
const restored=setup();
restored.visible(.5); restored.advance(800); restored.pageEvents.pagehide(); restored.advance(1000);
assert.equal(restored.events.length,0,'pagehide must cancel a partial impression');
restored.pageEvents.pageshow(); restored.visible(.5); restored.advance(1000);
assert.equal(restored.events.length,1,'restored page requires a fresh full interval');
const t=setup();
t.visible(.49); t.advance(1500); assert.equal(t.events.length,0);
t.visible(.5); t.advance(999); assert.equal(t.events.length,0);
t.document.visibilityState='hidden'; t.listeners.visibilitychange(); t.advance(1000); assert.equal(t.events.length,0);
t.document.visibilityState='visible'; t.listeners.visibilitychange(); t.advance(1000); assert.equal(t.events[0][0],'offer_impression');
t.visible(.7); t.advance(1500); assert.equal(t.events.length,1,'impression must be deduplicated');
const link=t.slot.card.children[3]; link.click(); link.auxclick({button:1});
assert.equal(t.events.length,3);
assert.ok(t.events.every(e=>e[1].offer_id==='test_offer'));
assert.equal(link.rel,'sponsored noopener noreferrer');
assert.equal(link.target,'_blank');
const analytics=fs.readFileSync('assets/site-analytics.js','utf8');
for(const [host,flag] of [['localhost',null],['127.0.0.1',null],['preview.vercel.app',null],['www.cleanstems.com','1']]) {
 const win={location:{hostname:host},localStorage:{getItem:()=>flag}};
 vm.runInNewContext(analytics,{window:win,document:{createElement(){throw Error('Excluded analytics loaded network script');}}});
 assert.equal(typeof win.cleanStemsTrack,'function');
}
console.log('PASS: disabled offers, visibility threshold, continuous timing, foreground reset, deduplication, normal/middle clicks, shared IDs, link attributes, analytics exclusions.');
