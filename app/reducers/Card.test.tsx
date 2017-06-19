import {card} from './Card'
import {toCard} from '../actions/Card'
import {NAVIGATION_DEBOUNCE_MS}  from '../Constants'

describe('Card reducer', () => {
  it('Defaults to splash card', () => {
    expect(card(undefined, {type: 'NO_OP'}).name).toEqual('SPLASH_CARD');
  });

  it('Sets state and phase on toCard', () => {
    const state = card(undefined, toCard('SEARCH_CARD', 'DISCLAIMER'));
    expect(state.name).toEqual('SEARCH_CARD');
    expect(state.phase).toEqual('DISCLAIMER');
  });

  it('Does not debounce after some time', () => {
    let fixedNow = Date.now();
    spyOn(Date, 'now').and.callFake(function() {
      return fixedNow;
    });
    const state = card(undefined, toCard('SEARCH_CARD'));
    fixedNow += NAVIGATION_DEBOUNCE_MS + 10;
    expect(card(state, toCard('QUEST_CARD')).name).toEqual('QUEST_CARD');
  });

  it('Debounces NAVIGATE actions', () => {
    let fixedNow = Date.now();
    spyOn(Date, 'now').and.callFake(function() {
      return fixedNow;
    });
    const state = card(undefined, toCard('SEARCH_CARD'));
    fixedNow += 50; // ms
    expect(card(state, toCard('QUEST_CARD')).name).toEqual('SEARCH_CARD');
  });

  it('Respects overrideDebounce', () => {
    let fixedNow = Date.now();
    spyOn(Date, 'now').and.callFake(function() {
      return fixedNow;
    });
    const state = card(undefined, toCard('SEARCH_CARD'));
    fixedNow += 50; // ms
    expect(card(state, toCard('QUEST_CARD', null, true)).name).toEqual('QUEST_CARD');
  });
});
