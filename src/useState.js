import React from "react";
import ReactDOM from "react-dom";

let hookState = [];
let hookIndex = 0;
function useState(initialState) {
  hookState[hookIndex] = hookState[hookIndex] || initialState;
  const currentIndex = hookIndex;// 形成闭包保存当前下标值
  function setState (newState) {
    hookState[currentIndex] = newState;
    render();
    hookIndex = 0;
  };
  return [hookState[hookIndex++], setState];
};

function App() {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  return (
    <div>
      <p>{num1}</p>
      <button onClick={() => setNum1(num1 + 1)}>+1</button>
      <hr/>
      <p>{num2}</p>
      <button onClick={() => setNum2(num2 + 1)}>+1</button>
    </div>
  );
};

function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
};

render();