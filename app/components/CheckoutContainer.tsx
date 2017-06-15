import Redux from 'redux'
import {connect} from 'react-redux'
import Checkout, {CheckoutStateProps, CheckoutDispatchProps} from './Checkout'
import {toPrevious} from '../actions/Card'
import {checkoutSetState} from '../actions/Checkout'
import {openSnackbar} from '../actions/Snackbar'
import {authSettings} from '../Constants'
import {logEvent} from '../React'
import {AppState, CheckoutPhase, CheckoutState, QuestState, UserState} from '../reducers/StateTypes'

declare var window:any;


const mapStateToProps = (state: AppState, ownProps: any): CheckoutStateProps => {
  return {
    checkout: state.checkout,
    quest: state.quest,
    user: state.user,
  };
}

const mapDispatchToProps = (dispatch: Redux.Dispatch<any>, ownProps: any): CheckoutDispatchProps => {
  return {
    onError: (err: string): void => {
      logEvent('checkout_err', err);
      dispatch(openSnackbar('Error encountered: ' + err));
    },
    onHome: (): void => {
      dispatch(toPrevious('QUEST_START', undefined, true));
    },
    onPhaseChange: (phase: CheckoutPhase): void => {
      dispatch(checkoutSetState({phase}));
    },
    onSubmit: (braintree: any, checkout: CheckoutState, user: UserState): void => {
      dispatch(checkoutSetState({phase: 'PROCESSING'}));
      braintree.requestPaymentMethod((err: string, payload: any) => {
        if (err) {
          logEvent('checkout_request_err', err);
          dispatch(openSnackbar('Error encountered: ' + err));
          return dispatch(checkoutSetState({phase: 'ENTRY'}));
        }
        $.post({
          url: authSettings.urlBase + '/braintree/checkout',
          data: JSON.stringify({
            nonce: payload.nonce,
            amount: checkout.amount,
            productcategory: checkout.productcategory,
            productid: checkout.productid,
            userid: user.id,
            useremail: user.email,
          }),
          dataType: 'json',
        })
        .done((response: string) => {
// TODO what do API errors look like? Show to user and report
          logEvent('checkout_success', checkout.amount);
          dispatch(checkoutSetState({phase: 'DONE'}));
        })
        .fail((xhr: any, err: string) => {
          logEvent('checkout_submit_err', err);
          dispatch(openSnackbar('Error encountered: ' + err));
          dispatch(checkoutSetState({phase: 'ENTRY'}));
        });
      });
    },
  };
}

const CheckoutContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Checkout);

export default CheckoutContainer
