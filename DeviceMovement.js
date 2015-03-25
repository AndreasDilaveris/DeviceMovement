
function OrientationCalculations (){

	// http://w3c.github.io/deviceorientation/spec-source-orientation.html

	// return the correct compass heading when the provided parameters are defined, not null and represent absolute values.

	var degtorad = Math.PI / 180; // Degree-to-Radian conversion

	this.compassHeading = function ( alpha, beta, gamma ) {

		var _x = beta  ? beta  * degtorad : 0; // beta value
		var _y = gamma ? gamma * degtorad : 0; // gamma value
		var _z = alpha ? alpha * degtorad : 0; // alpha value

		var cX = Math.cos( _x );
		var cY = Math.cos( _y );
		var cZ = Math.cos( _z );
		var sX = Math.sin( _x );
		var sY = Math.sin( _y );
		var sZ = Math.sin( _z );

		// Calculate Vx and Vy components
		var Vx = - cZ * sY - sZ * sX * cY;
		var Vy = - sZ * sY + cZ * sX * cY;

		// Calculate compass heading
		var compassHeading = Math.atan( Vx / Vy );

		// Convert compass heading to use whole unit circle
		if( Vy < 0 ) {
		  compassHeading += Math.PI;
		} else if( Vx < 0 ) {
		  compassHeading += 2 * Math.PI;
		}

		return compassHeading * ( 180 / Math.PI ); // Compass Heading (in degrees)

	}

	this.getRotationMatrix = function ( alpha, beta, gamma ) {

		var _x = beta  ? beta  * degtorad : 0; // beta value
		var _y = gamma ? gamma * degtorad : 0; // gamma value
		var _z = alpha ? alpha * degtorad : 0; // alpha value

		var cX = Math.cos( _x );
		var cY = Math.cos( _y );
		var cZ = Math.cos( _z );
		var sX = Math.sin( _x );
		var sY = Math.sin( _y );
		var sZ = Math.sin( _z );

		//
		// ZXY rotation matrix construction.
		//

		var m11 = cZ * cY - sZ * sX * sY;
		var m12 = - cX * sZ;
		var m13 = cY * sZ * sX + cZ * sY;

		var m21 = cY * sZ + cZ * sX * sY;
		var m22 = cZ * cX;
		var m23 = sZ * sY - cZ * cY * sX;

		var m31 = - cX * sY;
		var m32 = sX;
		var m33 = cX * cY;

		return [
		m11,    m12,    m13,
		m21,    m22,    m23,
		m31,    m32,    m33
		];
	}


	this.getQuaternion = function ( alpha, beta, gamma ) {

		var _x = beta  ? beta  * degtorad : 0; // beta value
		var _y = gamma ? gamma * degtorad : 0; // gamma value
		var _z = alpha ? alpha * degtorad : 0; // alpha value

		var cX = Math.cos( _x/2 );
		var cY = Math.cos( _y/2 );
		var cZ = Math.cos( _z/2 );
		var sX = Math.sin( _x/2 );
		var sY = Math.sin( _y/2 );
		var sZ = Math.sin( _z/2 );

		//
		// ZXY quaternion construction.
		//

		var w = cX * cY * cZ - sX * sY * sZ;
		var x = sX * cY * cZ - cX * sY * sZ;
		var y = cX * sY * cZ + sX * cY * sZ;
		var z = cX * cY * sZ + sX * sY * cZ;

		return [ w, x, y, z ];
	}

};

function DeviceMovement (win){

	// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
	
	var dm=this;

	var oCalc = new OrientationCalculations,
		
		// deviceOrientation properties

		dO={

			G:null, /* left-to-right tilt >> -90 to 90 */
			B:null, /* front-to-back tilt >> -180 to 180; 90 screen faces user 0 screen faces sky */
			A:null, /* compass direction >> 0 to 360 -VALUES INCREASE COUNTER CLOCKWISE */

		},
		
		// screenOrientation

		sO={
			current: testOrientation()
		},

		//motionData

		mD={
			accel:null,
			accelG:null,
			rRate:null,
			i:null
		};			

	/*
		****** EVENTS *******
	*/

	// **** Calibration **** 
	('oncompassneedscalibration' in win)?
	    win.addEventListener("compassneedscalibration", calibrationEvent, true) :
	    noCalibrationEvent();

	// **** Orientation **** 
	(win.DeviceOrientationEvent)?
	     win.addEventListener("deviceorientation", orientationEvent, true) :
	     noOrientationEvent(); 

		/*

		// 'MozOrientation' no longer used. FireFox is normalized

		(win.OrientationEvent)?
			win.addEventListener('MozOrientation', function(eventData) {
				eventData.x // left-to-right tilt from -1 to +1
				eventData.y // front-to-back tilt from -1 to +1
				// MozOrientation does not provide this alpha
				eventData.z // z == vertical acceleration of device
			}, false) :
			noOrientationEvent() ; 

		*/

	// **** Motion **** 
	(win.DeviceMotionEvent)?
	     win.addEventListener("devicemotion", motionEvent, true) :
	     noMotionEvent(); 


	// **** Orientation Change **** 
	('onorientationchange' in win)?
		win.addEventListener("orientationchange", orientationChangeEvent, true) :
		noOrientationChangeEvent();

	
	/*
		****** EVENT LISTENERS *******
	*/
	//****************************************************************************************//


	// **** Calibration ****
	function calibrationEvent(event){}
	function noCalibrationEvent(){};

	// **** Orientation ****
	function orientationEvent(event) {		

		dO.G=event.gamma; /* left-to-right tilt >> -90 to 90 */
		dO.B=event.beta;  /* front-to-back tilt >> -180 to 180; 90 screen faces user 0 screen faces sky */
		dO.A=event.alpha;  /* compass direction >> 0 to 360 -VALUES INCREASE COUNTER CLOCKWISE */

		event.absolute; /* true if orientation is provided as a difference between the device coordinate frame and the Earth coordinate frame; */
	};

	function noOrientationEvent(){
		// initiate swipe functions
	};

	// **** Motion ****
	function motionEvent(event) {
	    mD.accel = event.acceleration;  /* a.x, a.y, a.z */
	    mD.accelG = event.accelerationIncludingGravity; /* ag.x, ag.y, ag.z */
	    mD.rRate = event.rotationRate; /* r.alpha, r.beta, r.gamma */
	    mD.i = event.interval; /* i */
	   
	}
	function noMotionEvent(){};

	// **** Orientation Change ****
	function orientationChangeEvent (event) {
	    win.addEventListener("resize", 
	    	function checkResize (){
				sO.current = testOrientation(); 
		        win.removeEventListener("resize", checkResize) ;
	    	}, true);
	};

	function noOrientationChangeEvent(){}; 


	//****************************************************************************************//

	function relativeRotation(val, limit){

		var gr = relativeRotation;
		var limit = !!limit;
		
		gr.rotations = function(){
			return (!!gr.rotation)? gr.rotation: 0;
		}
		
		if(!gr.init){
			gr.rotation = 0;
			gr.offset = val;
			gr.prev = val;
			gr.init=true;	
			return 0;		
		}

		/** when rotation passes the 0 / 360 degree marker **/

		var diff = val-gr.prev;

		if( diff < -270 || diff > 270 ){
			// (diff < -270) == '359 to 0 : increasing values'    
			// (diff > 270) == '0 to 359 : decreasing values'
			var dir = -diff/Math.abs(diff);
			gr.rotation+=dir
		};

		gr.prev = val;

		var rotations = val-(gr.offset-(360*gr.rotation));

		return (limit)?
			rotations%360 :
			rotations ;	
	};

	/* Solving for different orientations of phone needs work */

	function testOrientation(){
		return win.innerHeight >= win.innerWidth ? 'portrait' : 'landscape' ;
	};

	function isFacingUser() {
		return (dO.B>70 || Math.abs(dO.G)>45);		
	};	

	function rotationPortrait (a, b, g){
		// oCalc.compassHeading gives a 'mirror image' of dO.A ex. 1 >> 359, 30 >> 330, 90 >> 270, 180 >> 180
		// to solve this use:  Math.abs(compassHeading-360)		
		return Math.abs(oCalc.compassHeading(a, b, g)-360); 
	};


	//****************************************************************************************//

	// GET funcs

	this.getForce = function(){
		return mD.accel;
	}

	this.getForceG = function(){
		return mD.accelG;
	}

	this.getRotation = function(){
		return dO.A;
	}

	this.getRelRotation = function (limit){
		return relativeRotation(dO.A, limit);
	}


	this.getTilt = function(){
		return (sO.current=='portrait') ?  dO.G : -dO.B ;
	}

	this.getOriention = function(){
		return sO.current; 
	}

	//***************************************************//
	

	this.isPortrait = function(){
		return (sO.current=='portrait'); 
	}	
	
	//****************************************************************************************//


	this.getRotationSpecial = function(){
		var rotation = isFacingUser()? rotationPortrait (dO.A, dO.B, dO.G) : this.getRotation();
		return relativeRotation( rotation );		
	}

	//****************************************************************************************//

	this.dampener=5

	this.dampenRotation = function dampenRt (){

		var dmpnR=dampenRt,
			currRot = this.getRotationSpecial();

		function update(val){
			dmpnR.rotation = val;
			return val;
		}

		if(!dmpnR.init){
			 dmpnR.rotation = currRot;
			dmpnR.init=true;
		}

		var	dampen = 
				( Math.abs(Math.abs(dmpnR.rotation) - Math.abs(currRot)) <= this.dampener && Math.abs(mD.accel.x) <=.5 ) ? 
					dmpnR.rotation : 
					update(currRot) ;

		return dampen;

	}
};