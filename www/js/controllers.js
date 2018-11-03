angular.module('app.controllers', [])

  .controller('loginCtrl', function($scope,$rootScope,$ionicHistory,sharedUtils,$state,$ionicSideMenuDelegate) {
    $rootScope.extras = false;  // For hiding the side bar and nav icon

    // When the user logs out and reaches login page,
    // we clear all the history and cache to prevent back link
    $scope.$on('$ionicView.enter', function(ev) { 
      if(ev.targetScope == $scope) {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $scope.user = {};
        console.log("clear scope");
      }
    });

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {

        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $ionicSideMenuDelegate.canDragContent(true);  // Sets up the sideMenu dragable
        $rootScope.extras = true;
        sharedUtils.hideLoading();
        $state.go('locationsList', {}, {location: "replace"});

      }
    });


    $scope.loginEmail = function(formName,cred) {


      if(formName.$valid) {  // Check if the form data is valid or not

        sharedUtils.showLoading();

        //Email
        firebase.auth().signInWithEmailAndPassword(cred.email,cred.password).then(function(result) {

            // You dont need to save the users session as firebase handles it
            // You only need to :
            // 1. clear the login page history from the history stack so that you cant come back
            // 2. Set rootScope.extra;
            // 3. Turn off the loading
            // 4. Got to menu page

            $ionicHistory.nextViewOptions({
              historyRoot: true
            });
            $rootScope.extras = true;
            sharedUtils.hideLoading();
            $state.go('locationsList', {}, {location: "replace"});

          },
          function(error) {
            sharedUtils.hideLoading();
            sharedUtils.showAlert("Xem lại","Lỗi đăng nhập");
          }
        );

      }else{
        sharedUtils.showAlert("Xem lại","Dữ liệu nhập vào không hợp lệ");
      }

    };

  })

  .controller('signupCtrl', function($scope,$rootScope,sharedUtils,$ionicSideMenuDelegate,
                                     $state,fireBaseData,$ionicHistory) {
    $rootScope.extras = false; // For hiding the side bar and nav icon

    $scope.signupEmail = function (formName, cred) {

      if (formName.$valid) {  // Check if the form data is valid or not

        sharedUtils.showLoading();

        //Main Firebase Authentication part
        firebase.auth().createUserWithEmailAndPassword(cred.email, cred.password).then(function (result) {

          //Registered OK
          // $ionicHistory.nextViewOptions({
          //   historyRoot: true
          // });
          $ionicSideMenuDelegate.canDragContent(true);  // Sets up the sideMenu dragable
          $rootScope.extras = true;
          sharedUtils.hideLoading();
          $state.go('locationsList', {}, {location: "replace"});

        }, function (error) {
          sharedUtils.hideLoading();
          sharedUtils.showAlert("Xem lại","Lỗi đăng ký");
        });

      }else{
        sharedUtils.showAlert("Xem lại","Dữ liệu nhập vào không hợp lệ");
      }

    }

  })

  .controller('locationsCtrl', function($scope,$rootScope,$ionicSideMenuDelegate,
                                     fireBaseData,$state,$ionicPopup,$firebaseObject,
                                     $ionicHistory,$firebaseArray,sharedUtils) {

    //Check if user already logged in
    sharedUtils.showLoading();
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $scope.user_info=user;
        $scope.locations= $firebaseArray(fireBaseData.refMqtt().child(user.uid).child("locations"));
        $scope.locations.$loaded().then(function(data) {   //Calls when the firebase data is loaded
          sharedUtils.hideLoading();
        }, 500);

      }else {

        $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
        $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $rootScope.extras = false;
        sharedUtils.hideLoading();
        $state.go('tabsController.login', {}, {location: "replace"});
        sharedUtils.hideLoading();
      }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras=true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function(ev) {
      if(ev.targetScope !== $scope){
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
      }
    });

    //Edit section
    $scope.itemManipulation = function(edit_val) {  // Takes care of item add and edit ie Item Manipulator
      var title,sub_title;
      if(edit_val!=null) {
        $scope.data=null;
        $scope.data = edit_val; // For editing address
        title="Edit Location";
        sub_title="Edit your location";
      }
      else {
        $scope.data = {};    // For adding new address
        title="Add Location";
        sub_title="Add a new location";
      }
      // An elaborate, custom popup
      var connectionPopup = $ionicPopup.show({
        template: '<input type="text"   placeholder="Location"  ng-model="data.location"> <br/> ' +
                  '<input type="text"   placeholder="Name" ng-model="data.name"> <br/> '+
                  '<input type="text"   placeholder="Info" ng-model="data.info"> <br/> '+
                  '<input type="text"   placeholder="Image (Optional)"  ng-model="data.img"> <br/> ',
        title: title,
        subTitle: sub_title,
        scope: $scope,
        buttons: [
          { text: 'Đóng' },
          {
            text: '<b>Lưu</b>',
            type: 'button-positive',
            onTap: function(e) {
              if ( !$scope.data.location || !$scope.data.name) {
                e.preventDefault(); //don't allow the user to close unless he enters full details
              } else {
                return $scope.data;
              }
            }
          }
        ]
      });

      connectionPopup.then(function(res) {

        if(edit_val!=null) {
          //Update  address
          if(res!=null) { //res == null => close()
            if(!res.img){ res.img="location_bg_default.png";  }
            fireBaseData.refMqtt().child($scope.user_info.uid).child("locations").child(edit_val.$id).update({    // set
              location: res.location,
              name: res.name,
              info: res.info,    
              img:res.img
            });
          }
        }else{
          //Add new address
          if(res!=null) {
            if (!res.img) {res.img = "location_bg_default.png";}
            fireBaseData.refMqtt().child($scope.user_info.uid).child("locations").push({    // set
              location: res.location,
              name: res.name,
              info: res.info,
              img: res.img
            });
          }
        }

      });

    };

    // A confirm dialog for deleting location
    $scope.deleteLocation = function(del_id) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Xóa địa điểm',
        template: 'Bạn có chắc muốn xóa địa điểm này không ?',
        buttons: [
          { text: 'Không' , type: 'button-stable' },
          { text: 'Có', type: 'button-assertive' , onTap: function(){return del_id;} }
        ]
      });

      confirmPopup.then(function(res) {
        if(res) {
          fireBaseData.refMqtt().child($scope.user_info.uid).child("locations").child(res).remove();
        }
      });
    };

    $scope.view_location=function(c_id){
      fireBaseData.refMqtt().child($scope.user_info.uid).update({currentLocationId: c_id }); //set the current location
      $state.go('devicesList', {}, {location: "replace"}); //move to deviceList page
    };

  })

  .controller('devicesCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate,
                                      fireBaseData, $state, $ionicPopup, $firebaseObject,
                                      $ionicHistory, $firebaseArray, sharedUtils) {

         
    
    sharedUtils.showLoading(); // starts with loading bar
    /*--------------------------------FIREBASE---------------------------*/
    
    $rootScope.extras = true;
    firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      userData = $firebaseObject(fireBaseData.refMqtt().child(user.uid));  //Mqtt data
      userData.$loaded().then(function (data) {   //Calls when the firebase data is loaded
        $scope.currentLocationId = userData.currentLocationId;
        $scope.devices = $firebaseArray(fireBaseData.refMqtt().child(user.uid).child("locations").child(userData.currentLocationId).child("devices"));
        $scope.devices.$loaded().then(function (data) {   //Calls when the firebase data is loaded
          sharedUtils.hideLoading();
        }, 500);
      }, 500);
    } else {

      $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
      $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

      $ionicHistory.nextViewOptions({
        historyRoot: true
      });
      $rootScope.extras = false;
      sharedUtils.hideLoading();
      $state.go('tabsController.login', {}, { location: "replace" });
      sharedUtils.hideLoading();
    }
  });    
    
    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
      if (ev.targetScope !== $scope) {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
      }
    });

    //Edit section
    $scope.itemManipulation = function (edit_val) {  // Takes care of item add and edit ie Item Manipulator
      var title, sub_title;
      if (edit_val != null) {
        $scope.data = null;
        $scope.data = edit_val; // For editing address
        title = "Edit Device";
        sub_title = "Edit your Device";
      }
      else {
        $scope.data = {};    // For adding new address
        title = "Add Device";
        sub_title = "Add a new device";
      }
    
      // An elaborate, custom popup
      var connectionPopup = $ionicPopup.show({
        template:
          '<input type="text"   placeholder="Device ID"  ng-model="data.device"> <br/>'+ //Tên thiết bị
          '<input type="text"   placeholder="Chức năng" ng-model="data.info"> <br/> ' +  //Chức năng
          '<input type="text"   placeholder="Loại thiết bị" ng-model="data.type"> <br/> ' +
          // '<ion-list ng-model="data.device">'+
          // '<ion-radio  ng-value="1">AT01</ion-radio>'+
          // '<ion-radio  ng-value="2">AT02</ion-radio>'+
          // '<ion-radio  ng-value="3">AT03</ion-radio>'+
          // '</ion-list>'+
          '<input type="text"   placeholder="Ảnh (Optional)"  ng-model="data.img"> <br/> ',
        title: title,
        subTitle: sub_title,
        scope: $scope,
        buttons: [
          { text: 'Đóng' },
          {
            text: '<b>Lưu</b>',
            type: 'button-positive',
            onTap: function (e) {
              if (!$scope.data.device || !$scope.data.type) {
                e.preventDefault(); //don't allow the user to close unless he enters full details
              } else {
                return $scope.data;
              }
            }
          }
        ]
      });

      connectionPopup.then(function (res) {

        if (edit_val != null) {
          //Update  address
          if (res != null) { //res == null => close()
            if (!res.img) { res.img = "device_bg_default.jpg"; }
            fireBaseData.refMqtt().child($scope.user_info.uid).child("locations").child($scope.currentLocationId).child("devices").child(edit_val.$id).update({    // set
              device: res.device,
              type: res.type,
              info: res.info,
              img: res.img
            });
          }
        } else {
          //Add new address
          if (res != null) {
            if (!res.img) { res.img = "device_bg_default.png"; }
            fireBaseData.refMqtt().child($scope.user_info.uid).child("locations").child($scope.currentLocationId).child("devices").push({    // set
              device: res.device,
              type: res.type,
              info: res.info,
              img: res.img
            });
          }
        }

      });

    };

    // A confirm dialog for deleting device
    $scope.deleteDevice = function (del_id) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Xóa thiết bị',
        template: 'Bạn có chắc muốn xóa thiết bị này không ?',
        buttons: [
          { text: 'Không', type: 'button-stable' },
          { text: 'Có', type: 'button-assertive', onTap: function () { return del_id; } }
        ]
      });

      confirmPopup.then(function (res) {
        if (res) {
          fireBaseData.refMqtt().child($scope.user_info.uid).child("locations").child($scope.currentLocationId).child("devices").child(res).remove();
        }
      });
    };

    $scope.view_device = function (c_id, c_type) {
      fireBaseData.refMqtt().child($scope.user_info.uid).update({ currentDevice: c_id }); //set the current device
      fireBaseData.refMqtt().child($scope.user_info.uid).update({ currentDeviceType: c_type }); 
      $state.go('device',{},{location: "replace"}); //move to device page
    };

  })


  .controller('indexCtrl', function($scope,$rootScope,sharedUtils,$ionicHistory,$state,$ionicSideMenuDelegate) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $scope.user_info=user; //Saves data to user_info
      }else {

        $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
        $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $rootScope.extras = false;
        sharedUtils.hideLoading();
        $state.go('tabsController.login', {}, {location: "replace"});

      }
    });

    $scope.logout=function(){

      sharedUtils.showLoading();

      // Main Firebase logout
      firebase.auth().signOut().then(function() {

        $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
        $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

        $ionicHistory.nextViewOptions({
          historyRoot: true
        });


        $rootScope.extras = false;
        sharedUtils.hideLoading();
        $state.go('tabsController.login',{}, {location:"replace"});

      }, function(error) {
        sharedUtils.showAlert("Lỗi","Lỗi đăng xuất")
      });
      $scope.user = {};

    }

  })

  .controller('compareAllCtrl', function($scope,$rootScope) {
    //For compare All
  })

  .controller('settingsCtrl', function($scope,$rootScope,fireBaseData,$firebaseObject,
                                       $ionicPopup,$state,$window,$firebaseArray,
                                       sharedUtils) {
    //Bugs are most prevailing here
    $rootScope.extras=true;
    //Shows loading bar
    sharedUtils.showLoading();
    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $scope.mqtt= $firebaseObject(fireBaseData.refMqtt().child(user.uid));
        $scope.user_info=user; //gives user id

        $scope.mqtt.$loaded().then(function(data) {   //Calls when the firebase data is loaded
          sharedUtils.hideLoading();
        }, 500);

      }
    });


    $scope.save= function (mqttRef) {

      if(mqttRef.username=="" || mqttRef.username==null){
        mqttRef.username="";
        mqttRef.password="";
      }
      if(mqttRef.ssl==null || mqttRef.ssl==""){
        mqttRef.ssl = false;
      }

      client_id="myClientId" + new Date().getTime();
      if( (mqttRef.url!="" && mqttRef.url!=null ) &&
          (mqttRef.port!="" && mqttRef.port!=null )
        ){
          console.log(fireBaseData.refMqtt());
          console.log($scope.user_info.uid);
          fireBaseData.refMqtt().child($scope.user_info.uid).update({
          url: mqttRef.url,
          port: mqttRef.port,
          username: mqttRef.username,
          password: mqttRef.password,
          ssl: mqttRef.ssl,
          clientId:client_id,
          currentLocation:"",
          currentDevice:"",
          currentDeviceType:""
        });
        sharedUtils.showAlert("Xong","Đã lưu cấu hình MQTT");
        $state.go('locationsList',{},{location:"replace"});
      }

    };

    $scope.cancel=function(){
      $window.location.reload(true);
    }

  })

  .controller('supportCtrl', function($scope,$rootScope) {

    $rootScope.extras=true;

  })

  /*   Device View Controller */

  .controller('device_viewCtrl', function ($scope,$rootScope,$state, $ionicPopup, fireBaseData,
                                    $firebaseObject, sharedUtils, ) {
  sharedUtils.showLoading(); // starts with loading bar
  /*--------------------------------FIREBASE---------------------------*/
  $rootScope.extras = true;
  //var mqttData;
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      mqttData = $firebaseObject(fireBaseData.refMqtt().child(user.uid));  //Mqtt data
      mqttData.$loaded().then(function (data) {   //Calls when the firebase data is loaded
        // check setting: mqtt server url, port, username, password
        if(!mqttData.url || !mqttData.port || !mqttData.username || !mqttData.password){
           // Redirect to setting page
           sharedUtils.showAlert("Chú ý","Chưa cấu hình MQTT");
           console.log("Chưa cấu hình MQTT");
           sharedUtils.hideLoading();
           $state.go('settings',{},{location:"replace"});
             
        } else {
          $scope.init_charts = false;
          $scope.devicetitle = "Thiết bị " + mqttData.currentDevice;
          $scope.prepareGraphs(mqttData.currentDeviceType);
          console.log("new MQTT client");  
          $scope.MQTTconnect();
        }
      }, 500);
    }
  });
  /*--------------------------------END OF FIREBASE---------------------------*/

  $scope.$on('$locationChangeStart', function (event, next, current) {
    if(client)
    {
      console.log(current);
      if(current.indexOf("10") !== -1)
      {
        console.log("disconnect");  
        if(client.isConnected()){
          client._reconnecting = false;
          client.disconnect();
        }
      }
    }
  });
  /*------------------------------DEVICE CONTROL--------------------*/
  //
  $scope.settingDevice = function (dev_id) {  // Takes care of item add and edit ie Item Manipulator
    var title, sub_title;
    title = "Cài đặt thiết bị "+ dev_id;
    sub_title = "Các thông số cài đặt";
    $scope.data = {
      led: true,
      alarm:true
    };    // For adding new address
      
    // An elaborate, custom popup
    var connectionPopup = $ionicPopup.show({
      template: 
        '<form name="devsettingForm" class="list " id="dev-settings-form">' +
        '<input type="text" placeholder="Tên SSID"  ng-model="data.ssid"> <br/>'+
        '<input type="text"   placeholder="Mật khẩu WiFi" ng-model="data.key"> <br/> ' +
        '<input  type="text"   placeholder="Chu kỳ đọc số liệu" ng-model="data.interval"> <br/> ' +
        '<label for="led">Đèn báo hiệu</label>' +
        '<input type="checkbox" id="led" ng-model="data.led"> <br/>'+
        '<label for="alarm">Cảnh báo</label>' +
        '<input type="checkbox" id="alarm" ng-model="data.alarm"> <br/>'+
        '</form>', 
      title: title,
      subTitle: sub_title,
      scope: $scope,
      buttons: [
        { text: 'Hủy' },
        {
          text: '<b>Lưu</b>',
          type: 'button-positive',
          onTap: function (e) {
            return $scope.data;
          }
        }
      ]
    });

    connectionPopup.then(function (res) {
    // send configure info to device
        var cmd = "setting";
        if(client && client.isConnected()) {
          
          if(res && res.ssid && res.ssid !== "" && res.key && res.key!== "") {
            cmd = cmd + "," + res.ssid + "," + res.key;
          }  
          if(res && res.interval && res.interval!=="") {
            cmd = cmd + "," + res.interval;
          }
          if(res) {
            if(res.led==false)
              cmd = cmd + "," + "off";
            else
              cmd = cmd + "," + "on";
            
            if(res.alarm==false)
              cmd = cmd + "," + "off";
            else
              cmd = cmd + "," + "on";
            
          }
          message = new Paho.MQTT.Message(cmd);
          message.destinationName = dev_id;
          console.log(dev_id,cmd);
          client.send(message);
        }
    });
  };

  $scope.resetDevice = function (dev_id) {
    
    
    var confirmPopup = $ionicPopup.confirm({
      title: 'Khởi động lại thiết bị',
      template: 'Bạn có muốn khởi động lại thiết bị '+ dev_id,
      buttons: [
        { text: 'Không', type: 'button-stable' },
        { text: 'Có', type: 'button-assertive', onTap: function () { return dev_id; } }
      ]
    });

    confirmPopup.then(function (res) {
      console.log(res)
      if (res) {
        console.log(client);
        if(client) {
          if(client.isConnected()) {        
            cmd = "reset";
            message = new Paho.MQTT.Message(cmd);
            message.destinationName = res;
            console.log(cmd,res);
            client.send(message);
          }   
        }
      }
    });
  };

  /*--------------------------------MQTT---------------------------*/
  //MQTT variables
  var client;
  $scope.MQTTconnect = function () {
    console.log("START");
    $scope.deviceId = mqttData.currentDevice;
    client = new Paho.MQTT.Client(
      mqttData.url,
      Number(mqttData.port),
      "/ws",
      mqttData.clientId  //Client Id
    );

    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    var options = {
      timeout: 3,
      reconnect: true,
      useSSL: mqttData.ssl,
      onSuccess: onConnect,
      onFailure: doFail
    };

    if (mqttData.username != "") {
      options.userName = mqttData.username;
      options.password = mqttData.password;
    }

    //console.log("TXSS", options);
    client.connect(options);
  };

  function onConnect() {
    sharedUtils.hideLoading();
    console.log("onConnect");
    //client.subscribe(mqttData.currentTopic); 
    console.log($scope.charts);
    if(!$scope.init_charts) {
      console.log(mqttData.currentDeviceType);
      if(mqttData.currentDeviceType=="AT01") {
        $scope.initAT01Charts();
        console.log("at01");
      }  
      else if(mqttData.currentDeviceType=="AT02")
          $scope.initAT02Charts();
      else if(mqttData.currentDeviceType=="AT03")
          $scope.initAT03Charts();
      else{  
          $scope.initCharts(); 
          console.log("else");
      }       
    }
    client.subscribe("test");

  }

  function doFail(e) {
    sharedUtils.hideLoading();
    console.log("Error", e);
    sharedUtils.showAlert("Lỗi cấu hình MQTT", "Kiểm tra lại các thông số!");
    //setTimeout($scope.MQTTconnect, reconnectTimeout);
  }

  // called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:" + responseObject.errorMessage);
      sharedUtils.showLoading();
      $scope.init_charts = false;
    }
  }

  // called when a message arrives
  function onMessageArrived(message) {
    var aqi, a = JSON.parse(message.payloadString);

    console.log(message.payloadString);
    //console.log(a.id);
    //console.log(a.co2);
    if(mqttData.currentDevice==a.id) 
    {
        if (a.co2 >= 0) { //-ve number are reserved for notification
          $scope.addPointCO2(a.co2);
        }
        // add point to AQI CHART
        if((a.co >= 0) || (a.dust >= 0) ){
          aqi = $scope.getAQI(a.co, a.dust);
          $scope.addPointAQI(aqi);
        }
        if (a.co >= 0) { //-ve number are reserved for notification
          $scope.addPointCO(a.co);
        }
        if (a.dust >= 0) { //-ve number are reserved for notification
          $scope.addPointDust(a.dust);
        }
        if(a.humid>=0 && a.humid<=100) {
           $scope.addPointHumid(Number(a.humid));
          $scope.updatePointHumid(a.humid);
        } 
        if(a.temp>=0 && a.temp<=80) {
           $scope.addPointTemp(Number(a.temp));
          $scope.updatePointTemp(a.temp);
        }

    }
  }
  /*--------------------------------END OF MQTT---------------------------*/


  /*--------------------------------GRAPH---------------------------*/
  var graphs = [];
  $scope.prepareGraphs = function(device_type) {
    console.log(device_type);
    if(device_type=="AT01"){
      graphs.push("aqi_chart","co2_chart","dust_chart","temp1_chart","humid1_chart","humid_chart","temp_chart");
    } 
    else if(device_type=="AT03") {
      graphs.push("aqi_chart","co_chart","dust_chart","temp1_chart","humid1_chart");  
    }
    else if(device_type=="AT02") {
      graphs.push("aqi_chart","co_chart");  
    } 
    else
      graphs.push("aqi_chart","co_chart","co2_chart","dust_chart","temp_chart","temp1_chart","humid_chart","humid1_chart");
    $scope.charts = graphs;  
  }
  
  var ISTOffset = 420;   // IST offset UTC +7:00
  var co2_options = {
    chart: {
      renderTo: 'co2_chart',
      type: 'column',
      animation: Highcharts.svg, // don't animate in old IE
      marginRight: 30
    },
    title: {
      text: 'Nồng độ khí CO2'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      title: {
        text: 'đơn vị ppm'
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.dateFormat('%H:%M:%S', this.x) + '<br/>' +
          Highcharts.numberFormat(this.y, 2);
      }
    },
    credit: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    plotOptions: {
      column: {
          colorByPoint: true,
          pointPadding: 0.3,
          borderWidth: 1
      }
    },
    series: [{
      name: 'Nồng độ CO2',
      data: (function () {
        var data = [],
          time = moment().valueOf() + (ISTOffset * 60000),
          i;

        for (i = -9; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: null
          });
        }
        return data;
      }())
    }]

  }

  var co_options = {
    chart: {
      renderTo: 'co_chart',
      type: 'spline',
      animation: Highcharts.svg, // don't animate in old IE
      marginRight: 30
    },
    title: {
      text: 'Nồng độ khí CO'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      title: {
        text: 'đơn vị ppm'
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.dateFormat('%H:%M:%S', this.x) + '<br/>' +
          Highcharts.numberFormat(this.y, 2);
      }
    },
    credit: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    /*plotOptions: {
      column: {
          colorByPoint: true,
          pointPadding: 0.3,
          borderWidth: 4
      }
    },*/
    series: [{
      name: 'Nồng độ CO',
      data: (function () {
        var data = [],
          time = moment().valueOf() + (ISTOffset * 60000),
          i;

        for (i = -9; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: null
          });
        }
        return data;
      }())
    }]

  }
  var dust_options = {
    chart: {
      renderTo: 'dust_chart',
      type: 'column',
      animation: Highcharts.svg, // don't animate in old IE
      marginRight: 30
    },
    title: {
      text: 'Mật độ bụi'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      min:0,
      title: {
        text: 'đơn vị đo ug/m3'
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.dateFormat('%H:%M:%S', this.x) + '<br/>' +
          Highcharts.numberFormat(this.y, 2);
      }
    },
    credit: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    plotOptions: {
      column: {
          colorByPoint: true,
          pointPadding: 0.3,
          borderWidth: 1
      }
    },
    series: [{
      name: 'Mật độ bụi',
      data: (function () {
        var data = [],
          time = moment().valueOf() + (ISTOffset * 60000),
          i;

        for (i = -9; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: null
          });
        }
        return data;
      }())
    }]

  }
  var humid_options = {
    chart: {
      renderTo: 'humid_chart',
      type: 'spline',
      animation: Highcharts.svg, // don't animate in old IE
      marginRight: 30
    },
    title: {
      text: 'Độ ẩm không khí'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      title: {
        text: '%'
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.dateFormat('%H:%M:%S', this.x) + '<br/>' +
          Highcharts.numberFormat(this.y, 2);
      }
    },
    credit: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Humidity Sensor data',
      data: (function () {
        var data = [],
          time = moment().valueOf() + (ISTOffset * 60000),
          i;

        for (i = -9; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: null
          });
        }
        return data;
      }())
    }]

  }

  var temp_options = {
    chart: {
      renderTo: 'temp_chart',
      type: 'spline',
      animation: Highcharts.svg, // don't animate in old IE
      marginRight: 30
    },
    title: {
      text: 'Biểu đồ nhiệt độ theo thời gian'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      title: {
        text: '\u00B0 C'
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.dateFormat('%H:%M:%S', this.x) + '<br/>' +
          Highcharts.numberFormat(this.y, 2);
      }
    },
    credit: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Temp Sensor data',
      data: (function () {
        var data = [],
          time = moment().valueOf() + (ISTOffset * 60000),
          i;

        for (i = -9; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: null
          });
        }
        return data;
      }())
    }]

  }

  var temp1_options = {
    chart: {
      renderTo: 'temp1_chart',
      type: 'gauge',
      plotBackgroundc: null,
      plotBackgroundImage: null,
      plotBorderWidth: 0,
      plotShadow: false
  },

  title: {
      text: 'Đồng hồ đo nhiệt độ không khí'
  },

  pane: {
      startAngle: -150,
      endAngle: 150,
      background: [{
          backgroundcolor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                  [0, '#FFF'],
                  [1, '#333']
              ]
          },
          borderWidth: 0,
          outerRadius: '90%'
      }, {
          backgroundcolor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                  [0, '#333'],
                  [1, '#FFF']
              ]
          },
          borderWidth: 1,
          outerRadius: '87%'
      }, {
          // default background
      }, {
          backgroundcolor: '#DDD',
          borderWidth: 0,
          outerRadius: '84%',
          innerRadius: '82%'
      }]
  },

  // the value axis
  yAxis: {
      min: 0,
      max: 80,

      minorTickInterval: 'auto',
      minorTickWidth: 1,
      minorTickLength: 10,
      minorTickPosition: 'inside',
      // minorTickc: '#666',

      tickPixelInterval: 30,
      tickWidth: 2,
      tickPosition: 'inside',
      tickLength: 10,
      // tickc: '#666',
      labels: {
          step: 2,
          rotation: 'auto'
      },
      title: {
          text: '\u00B0 C'
      },
      plotBands: [{
          from: 0,
          to: 10,
          color: '#33BEFF'// light blue
      }, {
          from: 10,
          to: 20,
          color: '#55BF3B' // green
      }, {
          from: 20,
          to: 30,
          color: '#DDDF0D' // yellow
      },{
        from: 30,
        to: 40,
        color: '#FF5733' // orange
      }, {
        from: 40,
        to: 80,
        color: '#DF5353' // red  
    }]
  },

  series: [{
      name: 'Nhiệt độ',
      data: [0],
      tooltip: {
          valueSuffix: ' \u00B0 C)'
      }
  }]
};

var humid1_options = {
  chart: {
    renderTo: 'humid1_chart',
    type: 'gauge',
    plotBackgroundc: null,
    plotBackgroundImage: null,
    plotBorderWidth: 0,
    plotShadow: false
},

title: {
    text: 'Đồng hồ đo độ ẩm không khí'
},

pane: {
    startAngle: -150,
    endAngle: 150,
    background: [{
        backgroundcolor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
                [0, '#FFF'],
                [1, '#333']
            ]
        },
        borderWidth: 0,
        outerRadius: '90%'
    }, {
        backgroundcolor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
                [0, '#333'],
                [1, '#FFF']
            ]
        },
        borderWidth: 1,
        outerRadius: '87%'
    }, {
        // default background
    }, {
        backgroundcolor: '#DDD',
        borderWidth: 0,
        outerRadius: '84%',
        innerRadius: '82%'
    }]
},

// the value axis
yAxis: {
    min: 0,
    max: 100,

    minorTickInterval: 'auto',
    minorTickWidth: 1,
    minorTickLength: 10,
    minorTickPosition: 'inside',
    // minorTickcolor: '#666',

    tickPixelInterval: 30,
    tickWidth: 2,
    tickPosition: 'inside',
    tickLength: 10,
    // tickcolor: '#666',
    labels: {
        step: 2,
        rotation: 'auto'
    },
    title: {
        text: '%'
    },
    plotBands: [{
      from: 0,
      to: 20
      //color: '#DF5353' // red  
    },{
      from: 40,
      to: 60
      //color: '#DDDF0D' // yellow
    },{
      from: 20,
      to: 40
      //color: '#FF5733' // orange
    },{
      from: 60,
      to: 80
      //color: '#55BF3B' // green
    },{
        from: 80,
        to: 100
       // color: '#33BEFF'// light blue
    }]
},

series: [{
    name: 'Độ ẩm',
    data: [0],
    tooltip: {
        valueSuffix: ' %'
    }
}]
};

var aqi_options = {
  chart: {
    renderTo: 'aqi_chart',
    type: 'column',
    animation: Highcharts.svg, // don't animate in old IE
    marginRight: 30
  },
  title: {
    text: 'Chỉ số chất lượng không khí AQI'
  },
  xAxis: {
    type: 'datetime',
    tickPixelInterval: 150
  },
  yAxis: {
    title: {
      text: 'Chỉ số'
    }
  },
  tooltip: {
    formatter: function () {
      return '<b>' + this.series.name + '</b><br/>' +
        Highcharts.dateFormat('%H:%M:%S', this.x) + '<br/>' +
        Highcharts.numberFormat(this.y, 2);
    }
  },
  credit: {
    enabled: false
  },
  legend: {
    enabled: false
  },
  exporting: {
    enabled: false
  },
  plotOptions: {
    column: {
        colorByPoint: true,
        pointPadding: 0.3,
        borderWidth: 1
    }
  },
  series: [{
    name: 'Chỉ số AQI',
    data: (function () {
      var data = [],
        time = moment().valueOf() + (ISTOffset * 60000),
        i;

      for (i = -9; i <= 0; i += 1) {
        data.push({
          x: time + i * 1000,
          y: null
        });
      }
      return data;
    }())
  }]
}


var co2_chart, temp_chart, humid_chart, co_chart, temp1_chart, 
    humid1_chart, dust_chart, aqi_chart;

var I = [{low: 0, high: 50},{low:51,high: 100},{low: 101, high: 150},
                  {low:151, high:200},{low:201, high:300}, {low:301, high:400},
                    {low:401, high:500}];
var C_CO = [{low: 0, high: 4},{low:5,high: 10},{low: 11, high: 13},
                    {low:14, high:16},{low:17, high:30}, {low:31, high:40},
                    {low:41, high:51}];

var C_D = [{low: 0, high: 54},{low:55,high: 154},{low: 155, high: 254},
          {low:255, high:354},{low:355, high:424}, {low:425, high:504},
          {low:505, high:604}];

// Ham tinh chi so AQI

$scope.getAQI = function(co = 0,dust = 0) {
  var i,aqi_co, aqi_dust, aqi ;
  for(i=0;i<7;i++) {
    if(co>=C_CO[i].low && co<C_CO[i].high){
        aqi_co = Math.ceil((co - C_CO[i].low)*(I[i].high - I[i].low)/(C_CO[i].high - C_CO[i].low) + I[i].low);
    }
  }
  if(i>7) aqi_co = 500;

  for(i=0;i<7;i++) {
    if(dust>=C_D[i].low && dust<C_D[i].high){
        aqi_dust = Math.ceil((dust - C_D[i].low)*(I[i].high - I[i].low)/(C_D[i].high - C_D[i].low) + I[i].low);
    }
  }
  if(i>7) aqi_dust = 500;

  aqi = aqi_co >= aqi_dust ? aqi_co : aqi_dust;
  return aqi;
}

// Cac ham khoi tao Charts
$scope.initCharts = function() {
  co2_chart = Highcharts.chart(co2_options);
  co_chart = Highcharts.chart(co_options);
  temp_chart = Highcharts.chart(temp_options);
  temp1_chart = Highcharts.chart(temp1_options);  
  humid_chart = Highcharts.chart(humid_options);
  humid1_chart = Highcharts.chart(humid1_options);
  dust_chart = Highcharts.chart(dust_options);
  aqi_chart = Highcharts.chart(aqi_options);
  $scope.init_charts = true;
}

  $scope.initAT01Charts = function() {
    co2_chart = Highcharts.chart(co2_options);
    temp1_chart = Highcharts.chart(temp1_options);  
    humid1_chart = Highcharts.chart(humid1_options);
    dust_chart = Highcharts.chart(dust_options);
    aqi_chart = Highcharts.chart(aqi_options);
    // them
    humid_chart = Highcharts.chart(humid_options);
    temp_chart = Highcharts.chart(temp_options);
    $scope.init_charts = true;
  }

  $scope.initAT02Charts = function() {
    co_chart = Highcharts.chart(co_options);
    aqi_chart = Highcharts.chart(aqi_options);
    $scope.init_charts = true;
  }

  $scope.initAT03Charts = function() {
    co_chart = Highcharts.chart(co_options);
    temp1_chart = Highcharts.chart(temp1_options);  
    humid1_chart = Highcharts.chart(humid1_options);
    dust_chart = Highcharts.chart(dust_options);
    aqi_chart = Highcharts.chart(aqi_options);
    $scope.init_charts = true;
  }

   
  $scope.addPointCO2 = function (point) {
    var c; 
    if(point<800 && point>=0)
      c = '#55BF3B';
    else if(point<2000 && point>=800)
      c = '#DDDF0D';
    else if(point<4000 && point>=2000)
      c = '#FF5733' ;
    else if(point<8000 && point>=4000)
      c = '#DF5353';
    else if(point<10000 && point>8000)
      c = '#99004C';
    else if(point>=10000 )
      c = '#7E0023';
    co2_chart.series[0].addPoint(
      {
        x: moment().valueOf() + (ISTOffset * 60000),
        y: point,
        color:c 
      }, true, true
    );
  };

  
  $scope.addPointTemp = function (point) {
    temp_chart.series[0].addPoint(
      [
        moment().valueOf() + (ISTOffset * 60000),
        point
      ], true, true
    );
  };  

  $scope.updatePointTemp = function (val) {
    var point = temp1_chart.series[0].points[0];
    point.update(val);
  }; 
  
  $scope.updatePointHumid = function (val) {
    var point = humid1_chart.series[0].points[0];
    point.update(val);
  };   

  $scope.addPointHumid = function (point) {
    humid_chart.series[0].addPoint(
      [
        moment().valueOf() + (ISTOffset * 60000),
        point
      ], true, true
    );
  };

  $scope.addPointCO = function (point) {
    var c; 
    if(point<6 && point>=0)
      c = '#55BF3B';
    else if(point<10 && point>=5)
      c = '#DDDF0D';
    else if(point<13 && point>=10)
      c = '#FF5733' ;
    else if(point<16 && point>=13)
      c = '#DF5353';
    else if(point<31 && point>=16)
      c = '#99004C';
    else if(point>=31)
      c = '#7E0023';
        
    co_chart.series[0].addPoint(
    {
      x: moment().valueOf() + (ISTOffset * 60000),
      y: point,
      color: c
    }, true, true);
     
  };

  $scope.addPointAQI = function (point) {
    var c; 
    if(point<52 && point>=0)
      c = '#55BF3B';
    else if(point<102 && point>=52)
      c = '#DDDF0D';
    else if(point<152 && point>=102)
      c = '#FF5733' ;
    else if(point<201 && point>=152)
      c = '#DF5353';
    else if(point<301 && point>=201)
      c = '#99004C';
    else if(point>=301)
      c = '#7E0023';
        
    aqi_chart.series[0].addPoint(
    {
      x: moment().valueOf() + (ISTOffset * 60000),
      y: point,
      color: c
    }, true, true);
     
  };

  $scope.addPointDust = function (point) {
    var c; 
    if(point<55 && point>=0)
      c = '#55BF3B';
    else if(point<155 && point>=55)
      c = '#DDDF0D';
    else if(point<255 && point>=155)
      c = '#FF5733' ;
    else if(point<355 && point>=255)
      c = '#DF5353';
    else if(point<425 && point>=355)
      c = '#99004C';
    else if(point<605 && point>=425)
      c = '#7E0023';
    
    dust_chart.series[0].addPoint(
       {
         x: moment().valueOf() + (ISTOffset * 60000),
         y: point,
         color: c
       }, true, true
    );
  };
});

/*--------------------------------END OF GRAPH---------------------------*/


