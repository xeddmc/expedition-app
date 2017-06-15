import Redux from 'redux'
import {CheckoutBraintreeLoadedAction, CheckoutSetStateAction} from './ActionTypes'
import {toCard} from './Card'
import {openSnackbar} from './Snackbar'
import {login} from './User'
import {authSettings} from '../Constants'
import {logEvent} from '../React'
import {UserState} from '../reducers/StateTypes'

declare var window:any;
const braintree = require('braintree-web');


export function checkoutSetState(delta: any) {
  return (dispatch: Redux.Dispatch<any>): any => {
    dispatch({type: 'CHECKOUT_SET_STATE', ...delta} as CheckoutSetStateAction);
  };
}

export function loadBraintreeToken() {
  return (dispatch: Redux.Dispatch<any>): any => {
    $.get(authSettings.urlBase + '/braintree/token')
        .done((token: string) => {
          dispatch({type: 'CHECKOUT_BRAINTREE_LOADED', token} as CheckoutBraintreeLoadedAction);
        })
        .fail((xhr: any, error: string) => {
          logEvent('braintree_load_error', error);
        });
  };
}

export function toCheckout(user: UserState, amount: number) {
  return (dispatch: Redux.Dispatch<any>): any => {
    if (!user.loggedIn) {
      dispatch(login((user: UserState) => {
        logEvent('to_checkout', amount);
        dispatch(toCard('CHECKOUT'));
      }));
    } else {
      logEvent('to_checkout', amount);
      dispatch(toCard('CHECKOUT'));
    }
  }
}
