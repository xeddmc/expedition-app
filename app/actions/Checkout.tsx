import Redux from 'redux'
import Fetch from 'node-fetch'
import {CheckoutBraintreeLoadedAction, CheckoutSetStateAction} from './ActionTypes'
import {toCard} from './Card'
import {openSnackbar} from './Snackbar'
import {login} from './User'
import {authSettings} from '../Constants'
import {logEvent} from '../React'
import {UserState} from '../reducers/StateTypes'

declare var window:any;


export function checkoutSetState(delta: any) {
  return (dispatch: Redux.Dispatch<any>): any => {
    dispatch({type: 'CHECKOUT_SET_STATE', ...delta} as CheckoutSetStateAction);
  };
}

export function loadBraintreeToken(callback?: (err: string, token?: string) => void) {
  return (dispatch: Redux.Dispatch<any>): any => {
    callback = callback || (() => {});
    Fetch(authSettings.urlBase + '/braintree/token')
    .then((value) => {
      if (!value.ok) {
        logEvent('braintree_load_error', value.status);
        return callback(value.statusText);
      }
      value.text().then((token: string) => {
        dispatch({type: 'CHECKOUT_BRAINTREE_LOADED', token} as CheckoutBraintreeLoadedAction);
        callback(null, token);
      });
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
