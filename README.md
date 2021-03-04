# 手动实现react hooks
Hook 是 React 16.8 的新增特性。它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性。常用的hook有useState,useMemo,useCallback,useEffect,useLayoutEffect,useContext,useReducer。

今天我们就逐个来手动实现一下。

## useState
useState返回一个 state，以及更新 state 的函数。
### 使用
我们使用useState实现一个加数器，点击+1时数字+1。
```javascript
import React from "react";
import ReactDOM from "react-dom";
function Couter() {
  const [num, setNum] = React.useState(0);
  return (
    <div>
      <p>{num}</p>
      <button onClick={() => setNum(num + 1)}>+1</button>
    </div>
  );
};
ReactDOM.render(<Couter />, document.getElementById("root"));
```
如图：

![image](https://user-images.githubusercontent.com/48183966/110017959-c1b38700-7d61-11eb-8bc7-6b44ffa5f3cd.png)


### 实现
#### 第一版
useState函数传入一个值作为初始值，并返回一个数组，第一个值为变量，第二个参数为改变变量的函数，所以我们思路如下：
- 使用一个变量lastState存放初始值initialState，若该变量本身有值，则使用本身值；
- 创建一个setState函数，传入一个新值（修改后的值），将新值覆盖掉lastState，并重新渲染组件；
- 将lastState和setState函数放在数组中返回。
```javascript
import React from "react";
import ReactDOM from "react-dom";
let lastState;
function useState(initialState) {
  lastState = lastState || initialState;
  function setState(newState) {
    lastState = newState;
    render();// 重新渲染组件
  };
  return [lastState, setState];
};
function Counter() {
  const [num, setNum] = useState(0);
  return (
    <div>
      <p>{num}</p>
      <button onClick={() => setNum(num + 1)}>+1</button>
    </div>
  );
};
function render() {
  ReactDOM.render(<Counter />, document.getElementById("root"));
};
render();
```
这么一看，好像没有啥问题，但是当用useState创建多个变量时，就会出现多个变量共用一个值的情况。
同时还有一个问题，就是setState可以传一个值，也可以传一个返回值的函数。
我们接着改一改。
#### 第二版
- 将存放初始值的变量改为数组hookState
- 用hookIndex代表数组hookState的下标，当多次调用useState时，下标往后移。
```javascript
let hookState = [];
let hookIndex = 0;
function useState(initialState) {
  hookState[hookIndex] = hookState[hookIndex] || initialState;
  const currentIndex = hookIndex;// 形成闭包保存当前下标值
  function setState (newState) {
    if (typeof newState === 'function') {
      newState(hookState(currentIndex));
    }
    hookState[currentIndex] = newState;
    render();
    hookIndex = 0;
  };
  return [hookState[hookIndex++], setState];
};
```
这样，一个好用的useState就完成了！
## useCallback/useMemo
useCallback的作用是：当传入的依赖项发生变化时，才更新返回的回调函数。一般用于防止组件无意义的重复渲染。
useMemo和useCallback类似，但他返回的是一个值，useCallback(fn, deps) 相当于 useMemo(() => fn, deps)。也就是说，当传入的依赖项发生变化时，才更新返回的值。
我们先来看一个父组件内含一个子组件的场景：
```javascript
import React from "react";
import ReactDOM from "react-dom";
function Child({data, onButtonClick}) {
  console.log('child render');// 用来判断子组件是否渲染
  return <button onClick={onButtonClick}>{data}</button>
}
function App() {
  const [num, setNum] = React.useState(0);
  const [name, setName] = React.useState('Fang');
  const add = () => setNum(num+1);
  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)}/>
      <Child data={num} onButtonClick={add}/>
    </div>
  );
}
function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
}
render();
```
渲染出来如下：

![image](https://user-images.githubusercontent.com/48183966/110017455-30441500-7d61-11eb-86c7-c3b28a0ab754.png)

当我们在input框输入内容时，子组件也会跟着重新渲染，log出child render。
如果我们想要子组件在自己数据更新时才进行重新渲染的话，就需要useCallback。
### 使用
我们用memo将子组件包着，使得子组件的props值发生变化时，子组件才重新渲染；
同时使用useCallback将add函数包一下，用useMemo把num包一下，使得如果不点击button改变数字时，返回值不会发生改变，从而使子组件不会做无效刷新：
```javascript
import React from "react";
import ReactDOM from "react-dom";
let Child = ({ data, onButtonClick }) => {
  console.log("child render");
  return <button onClick={onButtonClick}>{data}</button>;
};
Child = React.memo(Child);
function App() {
  const [num, setNum] = React.useState(0);
  const [name, setName] = React.useState("Fang");
  const data = React.useMemo(() => ( num ), [num]);
  const add = React.useCallback(() => setNum(num + 1), [num]);
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Child data={data} onButtonClick={add} />
    </div>
  );
};
function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
};
render();
```
这样，当input框输入内容时，就不会log出child render。
### 实现
我们先实现一个useCallback。实现思路如下：
- 把回调函数callback和依赖项dependencies作为参数传入；
- 第一次执行时，将callback和dependencies存起来；
- 当不是第一次执行时，将存的旧依赖lastDependencies拿出，与传入的dependencies作对比；
- 若相同，则返回旧回调lastCallback；若不同则返回新的回调callback。
这里我们可以和useState共用一个数组存放，所以将自己实现的useState也拷过来。代码如下：
```javascript
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
  };
  return [hookState[hookIndex++], setState];
};
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
    };
  } else {
    hookState[hookIndex++] = [callback, dependencies];
    return callback;
  };
};
let Child = ({ data, onButtonClick }) => {
  console.log("child render");
  return <button onClick={onButtonClick}>{data}</button>;
};
Child = React.memo(Child);
function App() {
  const [num, setNum] = useState(0);
  const [name, setName] = useState("Fang");
  const data = React.useMemo(() => num, [num]);
  const add = useCallback(() => setNum(num + 1), [num]);
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Child data={data} onButtonClick={add} />
    </div>
  );
};
function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
};
render();
```
这样就实现了useCallback。而useMemo思路也非常类似，改成返回值就行：
```javascript
let hookState = [];
let hookIndex = 0;
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
    };
  } else {
    const newMemo = factory();
    hookState[hookIndex++] = [newMemo, dependencies];
    return newMemo;
  };
};
```
## useEffect/useLayoutEffect
我们先看看useEffect。

简单来说，它相当于class组件中的componentDidMount、componentDidUpdate、componentWillUnmount集合在一起。使用的方式就是，第一个参数传执行的回调函数，第二个参数传依赖项数组。当依赖项发生变化时，才执行useEffect中传入的回调函数。
```javascript
import React from "react";
import ReactDOM from "react-dom";
function App() {
  const [num, setNum] = React.useState(0);
  const [name, setName] = React.useState("Fang");
  function changeTitle () {
  document.title = num;
  console.log('changeTitle');
  }
  changeTitle();
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
```
### 使用
  React.useEffect(() => {
    changeTitle()
  },[num]);
### 实现
#### 第一版
思路如下：
- 准备一个数组hookState来存放要执行的回调函数，hookIndex表示数组的下标值；
- 第一次执行时，将dependencies存起来；
- 当不是第一次执行时，将存的旧依赖lastDependencies拿出，与传入的dependencies作对比；
- 若相同，则不执行回调函数；若不同执行回调，并更新依赖项dependencies。
```javascript
let hookState = [];
let hookIndex = 0;
function useEffect(callback, dependencies) {
  if (hookState[hookIndex]) {// 非第一次执行
    const lastDependencies = hookState[hookIndex];
    const same = dependencies.every(
      (item, index) => item === lastDependencies[index]
    );
    if (same) {
      hookIndex++;
    } else {
      hookState[hookIndex++] = dependencies;
      callback();
    };
  } else {// 第一次执行
    hookState[hookIndex++] = dependencies;
    callback();
  };
};
```
然后我们再说说useLayoutEffect。其实两者是很相似的，区别是useEffect的回调会被放入宏任务队列中，而useLayoutEffect的回调会被放入微任务队列中，useEffect中传的回调在布局绘制后执行，而useLayoutEffect中传的回调会在布局绘制后执行。如下图：
![image](https://user-images.githubusercontent.com/48183966/110017525-4520a880-7d61-11eb-9eca-71d87b839563.png)

我们用setTimeout把useEffect放到宏任务队列，用queueMicrotask把useLayoutEffect放到微任务队列中。
#### 第二版
```javascript
useEffect：
let hookState = [];
let hookIndex = 0;
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
useLayoutEffect：
let hookState = [];
let hookIndex = 0;
function useLayoutEffect(callback, dependencies) {
  if (hookState[hookIndex]) {
    const lastDependencies = hookState[hookIndex];
    const same = dependencies.every(
      (item, index) => item === lastDependencies[index]
    );
    if (same) {
      hookIndex++;
    } else {
      hookState[hookIndex++] = dependencies;
      queueMicrotask(callback);
    };
  } else {
    hookState[hookIndex++] = dependencies;
    queueMicrotask(callback);
  };
};
```
到这就结束了吗？其实还没有，因为useEffect还集成了componentWillUnmount的功能，也就是销毁函数，目的是为了清理副作用。

举个例子，还是熟悉的加数器，我们设置一个定时器setInterval，每个一秒加数器num+1，并依赖于num。这就会有一个问题，每次num变化，都会新建一个setInterval，越来越多的setInterval最终会导致页面卡死：
```javascript
function App() {
  const [num, setNum] = React.useState(0);
  React.useEffect(() => {
    setInterval(() => {
      setNum((num) => num + 1);
    }, 1000);
  }, [num]);
  return (
    <div>
      <p>number:{num}</p>
    </div>
  );
}
function render() {
  ReactDOM.render(<App />, document.getElementById("root"));
}
render();
```
我们需要在useEffect传的回调函数中返回销毁函数，而useEffect会在每次创建新的定时器时都先把上一个定时器销毁。
```
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNum((num) => num + 1);
    }, 1000);
    return () => {clearInterval(timer)}
  }, [num]);
 ```
#### 第三版
```javascript
useEffect：
let hookState = [];
let hookIndex = 0;
function useEffect(callback, dependencies) {
  if (hookState[hookIndex]) {// 非第一次渲染
    const [oldDestroy, lastDependencies] = hookState[hookIndex];
    const same = dependencies.every(
      (item, index) => item === lastDependencies[index]
    );
    if (same) {
      hookIndex++;
    } else {// 第一次渲染
      oldDestroy();
      let destroy = setTimeout(callback);// 拿到销毁函数
      hookState[hookIndex++] = [destroy, dependencies];
    };
  } else {
    let destroy = setTimeout(callback);// 拿到销毁函数
    hookState[hookIndex++] = [destroy, dependencies];
  };
};
```
## useContext
useContext接收一个context 对象并返回该 context 的当前值。
简单来说，就是使用React.createContext创建一个React的上下文context，然后订阅了这个上下文的组件就可以直接拿到上下文中提供的数据。
### 使用
```javascript
import React from "react";
import ReactDOM from "react-dom";
const Context = React.createContext();
function Child() {
  const { num, setNum } = React.useContext(Context);
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
```
### 实现
useContext的实现其实是非常简单的，context对象上有一个_currentValue属性，这个属性存放的就是在value属性传的值。
```javascript
function useContext(context) {
  return context._currentValue;
}
```

## useReducer
useReducer和useState有点类似，它更适合用于管理包含多个子值的 state 对象。它的工作原理和redux类似，接收一个形如 (state, action) => newState 的 reducer，并返回当前的 state 以及与其配套的 dispatch 方法。
### 使用
还是熟悉的加数器例子：
```javascript
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
function App() {
  const [state, dispatch] = React.useReducer(counterReducer, 0);
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
```
### 实现
思路与useState类似：
- 准备一个数组hookStates来存放初始值initialState，若该变量本身有值，则使用本身值。hookIndex表示数组的下标值；
- 声明一个dispatch函数，传递的参数为action，如果reducer存在，则将hookStates[currentIndex],和action传入并执行，存入hookStates。若不存在，则直接把action存入；
- 重新渲染组件，并将储存在hookStates的值和dispatch函数返回
```javascript
let hookStates = [];
let hookIndex = 0;
function useReducer(reducer, initialState) {
  hookStates[hookIndex] = hookStates[hookIndex] || initialState;
  const currentIndex = hookIndex;
  function dispatch(action) {
    hookStates[currentIndex] = reducer? reducer(hookStates[currentIndex], action) : action;
    render();// 重新渲染组件
    hookIndex = 0;
  };
  return [hookStates[hookIndex++], dispatch];
};
```
useReducer就实现了！
