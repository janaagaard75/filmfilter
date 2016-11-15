import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Store, createStore } from 'redux'
import { Provider } from 'react-redux'

import { ConnectedApp } from './main/components/App'
import { rootReducer } from './main/reducer'

import 'todomvc-app-css/index.css'

const initialState = {}

const store: Store<any> = createStore(rootReducer, initialState)

ReactDOM.render(
  <Provider store={store}>
    <ConnectedApp />
  </Provider>,
  document.getElementById('app')
)