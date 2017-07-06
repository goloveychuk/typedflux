import {BaseInterface, BaseStore} from './Store';
import {ActionType} from './Action';

// decorator, used to bind action
export function Bind<T>(action: ActionType<(...args: any[]) => T>) {
  return function (target: BaseStore<{}, {}>, propertyKey: string, descriptor: TypedPropertyDescriptor<(arg: T) => void>) {
    if (target.__bindings == undefined) {
      target.__bindings = new Map<symbol, Function>()
    }
    if (descriptor.value === undefined) {
      return
    }
    target.__bindings.set(action.id, descriptor.value)
  }
}

// decorator, used for functions which making api requests
// implemented skipping requests while others are executing
export function Request<Suc=void>(onSuccess?: ActionType<(arg: Suc) => any>, onFailed?: ActionType<(arg: Error) => any>) { // waiting for a https://github.com/Microsoft/TypeScript/issues/10717
  return function Request<S>(target: BaseInterface<S>, propertyKey: string, descriptor: TypedPropertyDescriptor<{ (...a: any[]): Promise<Suc> }>) {
    const oldVal = descriptor.value;
    if (oldVal === undefined) {
      return
    }
    (descriptor as any).value = async function (this: BaseInterface<S>, ...args: any[]): Promise<void> {
      const int = this as any as { __requestsPending: Map<string, boolean> } // force casting to access private var
      const pending = int.__requestsPending.get(propertyKey)
      if (pending === true) {
        return Promise.resolve()
      }

      int.__requestsPending.set(propertyKey, true)

      let res: any | Error
      try {
        res = await oldVal.apply(int, args)
      } catch (e) {
        res = e
      }
      finally {
        int.__requestsPending.set(propertyKey, false)
      }
      if (res instanceof Error) {
        if (onFailed !== undefined) {
          onFailed(res)
        } else {
          throw res
        }
        return
      }
      if (onSuccess !== undefined) {
        onSuccess(res)
      }

    }
  }
}

// todo3 implement caching to avoid recalculations
export function Computed<S>(target: BaseInterface<S>, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) {

}
