# typedflux
Simple flux stores for typescript based frontend

## Usage

### fluxapp 
`./app/fluxapp.ts`
```ts
import * as typedflux from 'typedflux';
import { Dispatcher } from 'flux';

const dispatcher = new Dispatcher()
export const FluxApp = new typedflux.FluxApp(dispatcher)

```

### actions
```ts
import {Actions} from 'typedflux';
import {FluxApp} from './fluxapp';

interface User {
    name: string
    rating: number
}

class UserActionsCls {
     create = Actions.Make<User>  // simple action, which return dispatched data
     create2(user: User) { //same as create
        return user
     }
     
     vote(user: User, vote: 1 | -1) { // action which modifies dispatched data
          return {
              rating: user.rating + vote
          }
     }
     
     dummy = Actions.MakeEmpty() // action which do not dispatch any data
     dummy2() { //same as dummy
      
     }
     deleteSuccess = Actions.Make<string>()
     deleteFailed = Actions.Make<Error>()
}

return const UserActions = FluxApp.CreateActions(UserActionsCls)

```

### Store
```ts
import { BaseInterface, BaseStore, Bind, Request } from 'typedflux';
import {FluxApp} from './fluxapp';
import { UserActions } from './user_actions';
import { List } from 'immutable';

class State {
    users: List<User> //you can use plain objects, not immutable
    constructor() {
      this.users = new List()
    }
}

class UserInterface extends BaseInterface<State> { 
// this is external, public store interface, which will be called from views
// it can read state but can't modify it
// interface can't access stores methods

    getUsers() { // can be called from views
        return users.sort(u => u.rating)
    }
    
    // making api requests
    @Request(UserActions.deleteSuccess, UserActions.deleteFailed) // typechecked here
    async DeleteUser(id: number) {
        await makeApiRequest(id) // if throws error - sends error to deleteFailed action
         
        return 'ok' //sends result to deleteSuccess action
    }
    
}

class UserStoreCls extends BaseStore<State, UserInterface> {
   state = new State()
   
   @Bind(UserActions.create) // type checked here action type and callback type
   onCreate(user: User) {
      const newState = this.state.updateIn(['users'], users => users.push(user))
      this.setState(newState)
   }
   
   @Bind(UsersActions.vote)
   onVote(user: User) { // get's return type of action, not [user: User, vote: 1 | -1]
       ...
   }
   
   someFunction() {
       const users = this.interface.getUsers() //can access interface actions
       ...
   }
   
   @Bind(UsersActions.deleteSuccess)
   onDeleteSuccess(res: string) {
       ...
   }
      
   @Bind(UsersActions.deleteFailed)
   onDeleteFailed(err: Error) {
       ...
   }
}

export const UserStore = FluxApp.CreateStore(UserStoreCls, UserInterface)
```

### Views
```ts
import {Connect} from 'typedflux';
import {UserActions} from './actions';
import {UserStore} fomr './store';

interface Props {
}

interface State {
   users: List<User>
}

@Connect<Props, State>([UserStore, {
  'users': UserStore.getUsers, //type checked. `'users'` is key in State. `UserStore.getUsers` is function which returns value for that key
  // otherkey: otherval
}],
// [SomeOtherStore, SomeOtherMapping]
)
class MyView extends React.Component<Props, State> {
   someMethod() {
       UserStore.deleteUser(id)
   }
   otherMethod() {
       UserActions.create(user)
   }
   render() {
       return this.state.users.map ....
   }
}

```
