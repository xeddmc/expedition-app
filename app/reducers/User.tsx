import Redux from 'redux'
import {UserState} from './StateTypes'
import {UserLoginAction, UserLogoutAction} from '../actions/ActionTypes'

export const initialState: UserState = {
  loggedIn: false,
  id: '',
  name: '',
  image: '',
  email: '',
};

export function user(state: UserState = initialState, action: Redux.Action): UserState {
  switch (action.type) {
    case 'USER_LOGIN':
      return (action as UserLoginAction).user;
    case 'USER_LOGOUT':
      return initialState;
    default:
      return state;
  }
}
