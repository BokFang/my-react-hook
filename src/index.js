import React from "react";
import ReactDOM from "react-dom";

let hookState = [];
let hookIndex = 0;
function useState(initialState) {
  hookState[hookIndex] = hookState[hookIndex] || initialState;
  const currentIndex = hookIndex;
  function setState(newState) {
    hookState[currentIndex] = newState;
    render();
    hookIndex = 0;
  }
  return [hookState[hookIndex++], setState];
}

function useEffect(callback, dependencies) {
  if (hookState[hookIndex]) {
    const lastDependencies = hookState[hookIndex];
    const same = dependencies.every(
      (item, index) => item === lastDependencies[index]
    );
    if (same) {
      hookIndex++;
    } else {
      hookState[hookIndex++] = dependencies;
      setTimeout(callback);
    };
  } else {
    hookState[hookIndex++] = dependencies;
    setTimeout(callback);
  };
};

function App() {
  const [num, setNum] = useState(0);
  const [name, setName] = useState("Fang");

  function changeTitle () {
  document.title = num;
  console.log('changeTitle');
  };

useEffect(() => {changeTitle()}, [num]);

  return (
    <div>
      <p>number:{num}</p>
      <p>name:{name}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() => {
          setNum(num + 1);
        }}
      >
        +
      </button>
    </div>
  );
}

function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
}

render();
