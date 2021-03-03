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

function useCallback(callback, dependencies) {
  if (hookState[hookIndex]) {
    const [lastCallback, lastDependencies] = hookState[hookIndex];
    const same = dependencies.every(
      (item, index) => item === lastDependencies[index]
    );
    if (same) {
      hookIndex++;
      return lastCallback;
    } else {
      hookState[hookIndex++] = [callback, dependencies];
      return callback;
    }
  } else {
    hookState[hookIndex++] = [callback, dependencies];
    return callback;
  }
}

function useMemo(factory, dependencies) {
  if (hookState[hookIndex]) {
    const [lastMemo, lastDependencies] = hookState[hookIndex];
    const same = dependencies.every(
      (item, index) => item === lastDependencies[index]
    );
    if (same) {
      hookIndex++;
      return lastMemo;
    } else {
      const newMemo = factory();
      hookState[hookIndex++] = [newMemo, dependencies];
      return newMemo;
    }
  } else {
    const newMemo = factory();
    hookState[hookIndex++] = [newMemo, dependencies];
    return newMemo;
  }
}

let Child = ({ data, onButtonClick }) => {
  console.log("child render");
  return <button onClick={onButtonClick}>{data}</button>;
};
Child = React.memo(Child);

function App() {
  const [num, setNum] = useState(0);
  const [name, setName] = useState("Fang");
  const data = useMemo(() => num, [num]);
  const add = useCallback(() => setNum(num + 1), [num]);
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Child data={data} onButtonClick={add} />
    </div>
  );
}

function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
}

render();
