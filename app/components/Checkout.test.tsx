import * as React from 'react'
import {shallow} from 'enzyme'
import Checkout, {CheckoutProps} from './Checkout'
import {initialState} from '../reducers/Checkout'

describe('Checkout', () => {
  it('shows "loading" when phase is loading');
  it('shows "processing" when phase is processing');
  it('shows "thank you" when phase is done');
});
