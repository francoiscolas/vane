module.exports = function (router) {
    //
    // Requests to "/" calls the index action of the Home controller.
    router.root({to: 'home#index'});

    //
    // Requests to "/about" calls the about action of the Home controller:
    //router.match('/about', {to: 'home#about'});

    //
    // If you need to specify a method then use the "via" option:
    //router.match('/about', {to: 'home#about', via: ['get']);
    //
    // Or use the shortcut "get()" (post(), put() and delete() also available):
    //router.get('/about', {to: 'home#about'});

    //
    // The following line:
    //router.resource('photo');
    // Will create the routes:
    // GET    /photo/new    photo#new
    // POST   /photo        photo#create
    // GET    /photo        photo#show
    // GET    /photo/edit   photo#edit
    // PUT    /photo        photo#update
    // DELETE /photo        photo#destroy
    //
    // Specify a different controller:
    //router.resource('photo', {controller: 'photos'});
    //
    // To only create some routes:
    //router.resource('photo', {only: ['new', 'create', 'show']});
    // Or create all excepting some:
    //router.resource('photo', {except: ['destroy']});
};
