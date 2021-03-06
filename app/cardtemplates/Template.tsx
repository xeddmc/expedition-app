import Redux from 'redux'
import * as React from 'react'
import {CardState, CardThemeType, SettingsType} from '../reducers/StateTypes'

import {initRoleplay} from './roleplay/Actions'
import RoleplayContainer from './roleplay/RoleplayContainer'

import {initCombat} from './combat/Actions'
import CombatContainer from './combat/CombatContainer'
import {combatScope, CombatState} from './combat/State'
import {CombatPhase} from './combat/Types'

import {Node} from 'expedition-qdl/lib/parse/Node'
import {TemplateContext} from './TemplateTypes'
import {getStore} from '../Store'

export function initCardTemplate(node: ParserNode, settings: SettingsType) {
  return (dispatch: Redux.Dispatch<any>): any => {
    switch (node.getTag()) {
      case 'roleplay':
        return dispatch(initRoleplay(node, settings));
      case 'combat':
        return dispatch(initCombat({node, settings}));
      default:
        throw new Error('Unsupported node type ' + node.getTag());
    }
  }
}

export function renderCardTemplate(card: CardState, node: ParserNode): JSX.Element {
  switch(card.phase || 'ROLEPLAY') {
    case 'ROLEPLAY':
      return <RoleplayContainer node={node}/>;
    case 'DRAW_ENEMIES':
    case 'PREPARE':
    case 'TIMER':
    case 'SURGE':
    case 'RESOLVE_ABILITIES':
    case 'RESOLVE_DAMAGE':
    case 'VICTORY':
    case 'DEFEAT':
    case 'NO_TIMER':
    case 'MID_COMBAT_ROLEPLAY':
      return <CombatContainer card={card} node={node}/>;
    default:
      return null;
  }
}

export function getCardTemplateTheme(card: CardState): CardThemeType {
  switch(card.phase || 'ROLEPLAY') {
    case 'ROLEPLAY':
      return 'LIGHT';
    case 'DRAW_ENEMIES':
    case 'PREPARE':
    case 'TIMER':
    case 'SURGE':
    case 'RESOLVE_ABILITIES':
    case 'RESOLVE_DAMAGE':
    case 'VICTORY':
    case 'DEFEAT':
    case 'NO_TIMER':
    case 'MID_COMBAT_ROLEPLAY':
      return 'DARK';
    default:
      return null;
  }
}

export function templateScope() {
  return combatScope();
}

export function defaultContext(): TemplateContext {
  const populateScopeFn = function() {
    return {
      contentSets: function(): {[content: string]: boolean} {
        const settings = getStore().getState().settings;
        return settings && settings.contentSets;
      },
      numAdventurers: function(): number {
        const settings = getStore().getState().settings;
        return settings && settings.numPlayers;
      },
      viewCount: function(id: string): number {
        return this.views[id] || 0;
      },
      ...templateScope(),
    };
  };

  // Caution: Scope is the API for Quest Creators.
  // New endpoints should be added carefully b/c we'll have to support them.
  // Behind-the-scenes data can be added to the context outside of scope
  const newContext: TemplateContext = {
    scope: {
      _: populateScopeFn(),
    },
    views: {},
    templates: {},
    path: ([] as any),
    _templateScopeFn: populateScopeFn, // Used to refill template scope elsewhere (without dependencies)
  };

  for (const k of Object.keys(newContext.scope._)) {
    newContext.scope._[k] = (newContext.scope._[k] as any).bind(newContext);
  }

  return newContext;
}

export class ParserNode extends Node<TemplateContext>{};
