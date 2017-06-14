import * as React from 'react'
import ReactDOM from 'react-dom'
import Button from './base/Button'
import {authSettings} from '../Constants'

const braintree = require('braintree-web');
const dropin = require('braintree-web-drop-in');

interface PaymentProps extends React.Props<any> {
  amount: number; // dollars
  onPaymentMethodReceived: any; // TODO func
  onReady: any; // TODO func
  onError: any; // TODO func
}

export default class Payment extends React.Component<PaymentProps, {}> {
  state: {
    braintreeInitialized: boolean,
    instance: any,
    state: 'LOADING' | 'SELECT' | 'DONE',
  };

  constructor(props: PaymentProps) {
    super(props);
    this.state = {
      braintreeInitialized: false,
      instance: null,
      state: 'LOADING',
    };
  }

// TODO make this its own card / card set
// Set up our API server to charge and respond
  // Also set up to generate client token: https://developers.braintreepayments.com/start/hello-server/node
  // prove that the logic works before styling
  // TODO: send + receive payment amount
// Create test number buttons on Featured Quest that redirects to this card with different amounts
// On this card
  // Title: Pay What You Want
  // "Amount: $ZC"
  // Payment input form
  // "Pay" button
// Move payment things to reducer / action so that we can globally track important state
  // Client token
  // Customer id
  // Payment amount
  // Payment state
  // -> upgrade to valut flow
// Show "Thank you" screen including amount
// Improved button text
  // Before we have a nonce from you, should be something like "Next" since you aren't paying just yet
  // Integrate with instance events paymentMethodRequestable and noPaymentMethodRequestable to show a more appropriate button text
  // ie "Enter payment information"

// TODO add analytics at every click to monitor entire funnel
// Also make sure we're recording as much as possible about the transaction to our DB
// TODO test multiple loads (real life: play multiple quests in one sitting)
  componentDidMount () {
    if (this.state.braintreeInitialized) { return; }

    $.get(authSettings.urlBase + '/braintree/token')
    .done((token: string) => {
      dropin.create({
        authorization: token,
        container: '#braintreeDropin',
        paypal: {
          flow: 'vault',
        },
      }, (err: string, instance: any) => {
// TODO error: stop + show error to user
        this.setState({braintreeInitialized: true, state: 'SELECT', instance});
      });
    })
    .fail((xhr: any, err: string) => {
// TODO show error, needs dispatch
      // dispatch(openSnackbar('Error initializing payment, code ' + xhr.status));
    });
  }

  _submit() {
    this.setState({state: 'LOADING'});
    if (this.state.state === 'SELECT') {
      this.state.instance.requestPaymentMethod((err: string, payload: any) => {
console.log('nonce', err, payload);
  // TODO error: show, enable button and stop
  // TODO fill in remaining values
        $.post({
          url: authSettings.urlBase + '/braintree/checkout',
          data: JSON.stringify({
            nonce: payload.nonce,
            amount: '13.37',
            user: 'TODO',
            quest: 'TODO',
          }),
          dataType: 'json',
        }).done((err: string, response: string) => {
// api error
console.log('done', err, response);
          this.setState({state: 'DONE'});
        })
        .fail((xhr: any, err: string) => {
// network error
console.log('fail', xhr, err);
          this.setState({state: 'ENTRY'});
        });

      });
    }
  }

  render() {
    return (
      <div id="braintree">
        <div id="braintreeDropin"></div>
        <Button id="braintreeSubmit" disabled={this.state.state === 'LOADING'} onTouchTap={() => { this._submit(); }}>
          {(this.state.state === 'LOADING') ? 'Loading...' : 'Pay'}
        </Button>
      </div>
    );
  }
}
