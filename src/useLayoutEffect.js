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