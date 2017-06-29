import * as React from 'react'

import Button from './base/Button'
import Card from './base/Card'
import {authSettings} from '../Constants'
import {CheckoutState, QuestState, UserState} from '../reducers/StateTypes'

declare var Stripe: any;


export interface CheckoutStateProps extends React.Props<any> {
  checkout: CheckoutState,
  quest: QuestState,
  user: UserState,
}

export interface CheckoutDispatchProps {
  onError: (error: string) => void;
  onHome: () => void;
  onPhaseChange: (phase: string) => void;
  onStripeLoad: (stripe: any) => void;
  onSubmit: (stripeToken: string, checkout: CheckoutState, user: UserState) => void;
}

export interface CheckoutProps extends CheckoutStateProps, CheckoutDispatchProps {}

export default class Checkout extends React.Component<CheckoutProps, {}> {
  state: { card: any, paymentError: string, paymentValid: boolean };

  constructor(props: CheckoutProps) {
    super(props);
    this.state = { card: null, paymentError: null, paymentValid: false };
  }

  componentDidMount() {
    if (this.state.card) { return; }
    let stripe = this.props.checkout.stripe;
    if (!stripe) {
// TODO pull this API key a new private config file
      stripe = Stripe('pk_test_8SATEnwfIx0U2vkomn04kSou');
      this.props.onStripeLoad(stripe);
    }
    const elements = stripe.elements();
    const card = elements.create('card', {
      style: {
        base: {
          fontSize: '18px',
          fontFamily: 'MinionPro, serif',
        },
      },
    });
    card.mount('#stripeCard');
    this.setState({card});

    card.on('change', (response: any) => {
      this.setState({
        paymentError: (response.error) ? response.error.message : null,
        paymentValid: response.complete,
      });
    });
  }

  handleSubmit(event: any) {
    this.props.checkout.stripe.createToken(this.state.card).then((result: any) => {
      if (result.error) {
        this.setState({paymentError: result.error.message});
      } else {
        this.props.onSubmit(result.token.id, this.props.checkout, this.props.user);
      }
    });
    event.preventDefault();
  }

  render() {
    const processing = this.props.checkout.phase === 'PROCESSING';
    switch (this.props.checkout.phase) {
      case 'ENTRY':
      case 'PROCESSING': // keep the same HTML so that React doesn't erase the form
        return (
          <Card title="Tip the Author">
            <div id="stripe">
              <form id="stripeForm" action="/charge" method="post" className={processing && 'disabled'}>
                <div className="form-row">
                  <p>Please enter your credit or debit card:</p>
                  <div id="stripeCard"></div>
                  <div id="stripeErrors" role="alert">{this.state.paymentError}</div>
                </div>
                {!processing && <Button id="stripeSubmit" disabled={!this.state.paymentValid} onTouchTap={(e: any) => this.handleSubmit(e)}>
                  {(this.state.paymentValid) ? 'Pay' : 'Enter payment info'}
                </Button>}
                {processing && <div className="centralMessage">Processing payment, one moment...</div>}
              </form>
              <label className="footnote">Payments processed by Stripe</label>
            </div>
          </Card>
        );
      case 'DONE':
        return (
          <Card title="Payment Complete">
            <div className="centralMessage">
              <p>Payment for ${this.props.checkout.amount} complete.</p>
              <p>Thank you for supporting Expedition!</p>
            </div>
            <Button onTouchTap={() => this.props.onHome()}>Return Home</Button>
          </Card>
        );
      default:
        return null;
    }
  }
}
