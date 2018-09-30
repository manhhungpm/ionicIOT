angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('tabsController.login', {
    url: '/page5',
    views: {
      'tab1': {
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      }
    }
  })

  .state('tabsController.signup', {
    url: '/page6',
    views: {
      'tab3': {
        templateUrl: 'templates/signup.html',
        controller: 'signupCtrl'
      }
    }
  })

  .state('locationsList', {
      url: '/page9',
      templateUrl: 'templates/locations_list.html',
      controller: 'locationsCtrl'
    })
  
    .state('devicesList', {
      url: '/page15',
      templateUrl: 'templates/devices_list.html',
      controller: 'devicesCtrl'
    })  
  
   

  .state('settings', {
    url: '/page12',
    templateUrl: 'templates/settings.html',
    controller: 'settingsCtrl'
  })

  .state('support', {
    url: '/page13',
    templateUrl: 'templates/support.html',
    controller: 'supportCtrl'
  })
  
  .state('device', {
      url: '/page10',
      templateUrl: 'templates/device_view.html',
      controller: 'device_viewCtrl'
  })  
  $urlRouterProvider.otherwise('/page1/page5')

});
