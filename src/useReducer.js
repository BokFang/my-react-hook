import React from "react";
import ReactDOM from "react-dom";

function counterReducer(state, action) {
  switch(action.type) {
    case 'add':
      return state + 1;
      default: 
      return state;
  };
};

let hookStates = [];
let hookIndex = 0;
function useReducer(reducer, initialState) {
  hookStates[hookIndex] = hookStates[hookIndex] || initialState;
  const currentIndex = hookIndex;
  function dispatch(action) {
    hookStates[currentIndex] = reducer? reducer(hookStates[currentIndex], action) : action;
    render();
    hookIndex = 0;
  };
  return [hookStates[hookIndex++], dispatch];
};

function App() {
  const [state, dispatch] = useReducer(counterReducer, 0);

  return (
    <div>
      <p>{state}</p>
      <button onClick={() => {dispatch({type: 'add'})}}>+</button>
    </div>
  );
}

function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
}

render();
