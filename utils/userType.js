class UserType {
    constructor(name) {
      if (new.target === UserType) {
        throw new TypeError("Cannot instantiate abstract class UserType directly");
      }
      this.name = name;
    }
  }
  
  class Guest extends UserType {
    constructor() {
      super('guest');
    }
  }
  
  class User extends UserType {
    constructor() {
      super('user');
    }
  }
  
  class Admin extends UserType {
    constructor() {
      super('admin');
    }
  }
  

  module.exports = { Guest: new Guest(), User: new User(), Admin: new Admin() };
  