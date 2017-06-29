declare var require: any;
declare var module: any;

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import theme from './Theme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import {authSettings} from './Constants'
import {toPrevious} from './actions/Card'
import {silentLogin} from './actions/User'
import {getStore} from './Store'
import {getWindow, getGapi, getDevicePlatform, getDocument} from './Globals'

const injectTapEventPlugin = require('react-tap-event-plugin');
const ReactGA = require('react-ga');

function setupTapEvents() {
  try {
    injectTapEventPlugin();
  } catch (e) {
    console.log('Already injected tap event plugin');
  }
}

export function logEvent(name: string, args: any): void {
  console.log('Event log: ' + name, args);
  const firebase = getWindow().FirebasePlugin;
  if (firebase) {
    firebase.logEvent(name, args);
  }

  const event: any = {
    category: 'log',
    action: name,
  };
  if (typeof args === 'string') {
    event.label = args;
  }
  if (typeof args === 'number') {
    event.value = args;
  }
  ReactGA.event(event);
}

function setupDevice() {
  const window = getWindow();

  // Apply class-specific styling
  const platform = getDevicePlatform();
  document.body.className += ' ' + platform;

  if (platform === 'android') {

    // Hide system UI and keep it hidden (Android 4.4+ only)
    window.AndroidFullScreen.immersiveMode(() => {
      console.log('Immersive mode enabled');
    }, () => {
      console.log('Immersive mode failed');
    });

    // DOM ready
    $(() => {
      // patch for Android browser not properly scrolling to input when keyboard appears
      $('body').on('focusin', 'input, textarea', (event) => {
        if (navigator.userAgent.indexOf('Android') !== -1) {
          var scroll = $(this).offset().top;
          $('.base_card').scrollTop(scroll);
        }
      });
    });
  }

  getDocument().addEventListener('backbutton', () => {
    getStore().dispatch(toPrevious());
  }, false);

  window.plugins.insomnia.keepAwake(); // keep screen on while app is open

  // silent login here triggers for cordova plugin, if gapi is loaded
  const gapi = getGapi();
  if (!gapi) {
    return;
  }
  getStore().dispatch(silentLogin(() => {
    // TODO have silentLogin return if successful or not, since will vary btwn cordova and web
    console.log('Silent login: ', gapi.auth2.getAuthInstance().isSignedIn);
  }));
}

function setupGoogleAPIs() {
  const gapi = getGapi();
  if (!gapi) {
    return;
  }

  gapi.load('client:auth2', () => {
    gapi.client.setApiKey(authSettings.apiKey);
    gapi.auth2.init({
      client_id: authSettings.clientId,
      scope: authSettings.scopes,
      cookie_policy: 'none',
    }).then(() => {
      // silent login here triggers for web
      getStore().dispatch(silentLogin(() => {
        // TODO have silentLogin return if successful or not, since will vary btwn cordova and web
        console.log('Silent login: ', gapi.auth2.getAuthInstance().isSignedIn);
      }));
    });
  });
}

function setupEventLogging() {
  const window = getWindow();
  if (window.FirebasePlugin) { // Load Firebase - only works on cordova apps
    window.FirebasePlugin.onTokenRefresh((token: string) => {
      // TODO save this server-side and use it to push notifications to this device
    }, (error: string) => {
      console.error(error);
    });
  }
}

function render() {
  // Require is done INSIDE this function to reload app changes.
  var Main = require('./components/base/Main').default;
  var base = getDocument().getElementById('react-app');
  ReactDOM.unmountComponentAtNode(base);
  ReactDOM.render(
    <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
      <Main/>
    </MuiThemeProvider>,
    base
  );
}

function setupHotReload() {
  if (module.hot) {
    module.hot.accept();
    module.hot.accept('./components/base/Main', () => {
      setTimeout(() => {render();});
    });
  }
}

function setupGoogleAnalytics() {
  ReactGA.initialize('UA-47408800-9');
  ReactGA.pageview('/');
  console.log('google analytics set up');
}

export function init() {
  getDocument().addEventListener('deviceready', () => {
    setupDevice();
  }, false);

  setupTapEvents();
  setupGoogleAPIs();
  setupEventLogging();
  setupHotReload();
  setupGoogleAnalytics();

  render();
}

// doInit is defined in index.html, but not in tests.
// This lets us setup the environment before initializing, or not init at all.
declare var doInit: boolean;
if (typeof doInit !== 'undefined') {
  init();
}
