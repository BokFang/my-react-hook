import React from "react";
import ReactDOM from "react-dom";

const Context = React.createContext();

function useContext(context) {
  return context._currentValue;
}

function Child() {
  const { num, setNum } = useContext(Context);
  return (
    <div>
      <p>{num}</p>
      <button onClick={() => setNum(num + 1)}>+</button>
    </div>
  );
}

function App() {
  const [num, setNum] = React.useState(0);

  return (
    <Context.Provider value={{ num, setNum }}>
      <Child />
    </Context.Provider>
  );
}

function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
}

render();
