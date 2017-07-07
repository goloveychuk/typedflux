import {FluxAppInterface} from './Common';



export type ActionType<T> = T & {
  id: symbol;
  defer: T
}

export function makeAction<T extends Function>(fluxapp: FluxAppInterface, name: string, fn: T): ActionType<T> {
  const id = Symbol(name);
  const action = function (...args: any[]) {
    fluxapp.dispatch(id, fn.apply(fn, args))
  } as any as T
  action.bind(action)
  const typedAction = action as ActionType<T>

  typedAction.id = id
  typedAction.defer = ((...args: any[]) => { setTimeout(() => action.apply(null, args)) }) as any as T
  return typedAction
}

export module Actions {
  // function to create simple action
  export function Make<T = void>() {
    return function (key: T): T {
      return key
    }
  }
  export function MakeEmpty() {
    return function () {

    }
  }
}