import React, { Component } from 'react'
import PropTypes from 'prop-types'

class App extends Component {
  render() {
    return <div />
  }
}

App.propTypes = {
  shipsTo: PropTypes.array.isRequired,
  onChangeAddress: PropTypes.func.isRequired,
  onChangeValidation: PropTypes.func,
}

export default App
