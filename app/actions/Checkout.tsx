import Redux from 'redux'
import {authSettings} from '../Constants'

import {CheckoutBraintreeLoadedAction, CheckoutSetStateAction} from './ActionTypes'
import {openSnackbar} from './Snackbar'

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
          window.FirebasePlugin.logEvent('braintree_error', error);
        });
  };
}
