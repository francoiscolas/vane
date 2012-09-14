//
// Requests to "/" calls the index action of the Home controller.
root({to: 'home#index'});

//
// Requests to "/about" calls the about action of the Home controller:
//match('/about', {to: 'home#about'});

//
// If you need to specify a method then use the "via" option:
//match('/about', {to: 'home#about', via: ['get']);
//
// Or use the shortcut "get()" (post(), put() and delete() also available):
//get('/about', {to: 'home#about'});

//
// The following line:
//resource('photo');
// Will create the routes:
// GET    /photo/new    photo#new
// POST   /photo        photo#create
// GET    /photo        photo#show
// GET    /photo/edit   photo#edit
// PUT    /photo        photo#update
// DELETE /photo        photo#destroy
//
// Specify a different controller:
//resource('photo', {controller: 'photos'});
//
// To only create some routes:
//resource('photo', {only: ['new', 'create', 'show']});
// Or create all excepting some:
//resource('photo', {except: ['destroy']});
