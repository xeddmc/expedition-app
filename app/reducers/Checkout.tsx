import Redux from 'redux'
import {CheckoutBraintreeLoadedAction, CheckoutSetStateAction} from '../actions/ActionTypes'
import {CheckoutState} from './StateTypes'

const initialState: CheckoutState = {
  amount: 0,
  braintreeToken: null,
  phase: 'LOADING',
  productcategory: '',
  productid: null,
};

export function checkout(state: CheckoutState = initialState, action: Redux.Action): CheckoutState {
  switch (action.type) {
    case 'CHECKOUT_SET_STATE':
      return {...state, ...(action as CheckoutSetStateAction)};
    case 'CHECKOUT_BRAINTREE_LOADED':
      return {...state, braintreeToken: (action as CheckoutBraintreeLoadedAction).token};
    default:
      return state;
  }
}
