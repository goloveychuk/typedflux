import { Dispatcher } from 'flux';
import { Payload, FluxAppInterface } from './Common';
import { makeAction, ActionType } from './Action'
import { BaseInterface, BaseStore } from './Store';


export type ActionsProxy<T> = {
  [K in keyof T]: ActionType<T[K]>
}


// signgleton stores instance, which have singleton dispatcher and other logic
export class FluxApp implements FluxAppInterface {
  dispatcher: Dispatcher<Payload<{}>>


  private __storesInitialStates = new Map<symbol, { state: any, cb: Function }>()
  // cleaning all stores
  recycle() {
    this.__storesInitialStates.forEach((v: { state: any, cb: Function }, k: any) => {
      v.cb(v.state)
    })
  }
  // saving initial stores state to recycle in future
  addStoreState<S>(id: symbol, state: S, cb: (stete: S) => any) {
    const v = { state: state, cb: cb }
    this.__storesInitialStates.set(id, v)
  }
  constructor(dispatcher: Dispatcher<Payload<{}>>) {
    this.dispatcher = dispatcher
  }
  dispatch<T>(action: symbol, data: T) {
    const payload: Payload<T> = {
      action,
      data
    }
    this.dispatcher.dispatch(payload)
  }

  allStoresDispatchTokens: string[] = []

  addStoreDispatchToken(token: string) {
    this.allStoresDispatchTokens.push(token)
  }

  CreateStore<S, I extends BaseInterface<S>, T extends BaseStore<S, I>>(storeCls: { new (...args: any[]): T }, intCls: { new (...args: any[]): I }): I {
    const st = new storeCls(this)
    const initialState = st.state
    this.addStoreState(st.__id, initialState, st.onRecycle.bind(st))
    this.addStoreDispatchToken(st.dispatchToken)
    const int = new intCls(this, st);
    // cycle reference
    st.interface = int;
    return int
  }


  CreateActions<T>(cls: { new (): T }): ActionsProxy<T> {
    for (const k of Object.getOwnPropertyNames(cls.prototype)) {
      if (k === 'constructor') {
        continue
      }
      cls.prototype[k] = makeAction(this, k, cls.prototype[k])
    }
    const ins = new cls() as any
    for (const k of Object.getOwnPropertyNames(ins)) {
      ins[k] = makeAction(this, k, ins[k])
    }
    return ins
  }


}


