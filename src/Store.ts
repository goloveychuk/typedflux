
import { EventEmitter, EventSubscription } from 'fbemitter';

import { ActionType } from './Action';
import { Payload, FluxAppInterface } from './Common'
import { Dispatcher } from 'flux';

export type DispatchToken = string



export abstract class BaseInterface<S, FA extends FluxAppInterface = FluxAppInterface>  {
  protected fluxapp: FA
  protected __store: BaseStore<S, {}>
  get state(): S {
    return this.__store.state;
  }
  set state(s: S) {
    throw new Error("Can't set state")
  }
  getState() {
    return this.state
  }
  constructor(fluxapp: FA, store: BaseStore<S, {}>) {
    this.fluxapp = fluxapp
    this.__store = store
  }
  // subcribe for store changes  
  listen(cb: Function) {
    const res = this.addListener(cb)
    return res.remove.bind(res)
  }
  addListener(cb: Function) {
    const sub = this.__store.__emitter.addListener(this.__store.__changeEvent, cb)
    return sub
  }

  getDispatcher() {
    return this.fluxapp.dispatcher
  }
  get dispatchToken() {
    return this.getDispatchToken()
  }
  getDispatchToken() {
    return this.__store.dispatchToken
  }

  private __requestsPending = new Map<string, boolean>() //used in decorator
}


// base store class to inherit froml
export abstract class BaseStore<S, I, FA extends FluxAppInterface = FluxAppInterface>  {
  abstract state: S;
  __emitter = new EventEmitter();
  __changeEvent = 'change';
  // api for making requests
  __id = Symbol()
  protected fluxapp: FA

  dispatchToken: DispatchToken

  protected setState(state: S) {
    this.state = state;
    this.emitChange();
  }
  protected waitFor(...stores: (BaseInterface<{}> | string)[]) {
    const tokens = stores.map(st => {
      if (typeof st === 'string')
        return st
      return st.getDispatchToken()
    })
    this.fluxapp.dispatcher.waitFor(tokens)
  }
  protected emitChange() {
    this.__emitter.emit(this.__changeEvent, this.state)
  }

  interface: I

  __bindings: Map<symbol, Function> //filled and maybe created by decorators

  // do not use constructor directly, use Create, it contains little magic
  constructor(fluxapp: FA) {
    this.fluxapp = fluxapp

    if (this.__bindings === undefined) {
      this.__bindings = new Map<symbol, Function>()
    }
    this.dispatchToken = fluxapp.dispatcher.register(<T>(payload: Payload<T>) => {
      const cb = this.__bindings.get(payload.action)
      if (cb === undefined) {
        return
      }
      cb.call(this, payload.data)
    })
  }
  onRecycle(state: S) {
    this.setState(state)
  }
}
