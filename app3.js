(_ => {
	'use strict';
	const polyfill = new WebXRPolyfill();
	const cvs = document.createElement('canvas');
	const xrButton = new XRDeviceButton({
		onRequestSession: device => device.requestSession({exclusive: true}).then(session => {
			xrButton.setSession(session);
			session.addEventListener('end', e => {
				xrButton.setSession(null)
				cvs.style.display = 'none'
			});
			start(session);
		}),
		onEndSession: session => session.end()
	});
	[cvs, xrButton.domElement].forEach(el => document.body.appendChild(el));
	if ( navigator.xr ) {
		navigator.xr.requestDevice()
			.then(device => device.supportsSession({exclusive: true}).then(_ => xrButton.setDevice(device)));
	}
	const start = session => {
		const start = isOK => {
			if ( !isOK ) return console.log('error');
			cvs.style.display = 'block'
			const world = RedWorld();
			const scene = RedScene(redGL);
			const renderer = RedRenderer();
			const camL = RedCamera(), camR = RedCamera();
			// redGL.renderScale = 0.5
			redGL.world = world;
			renderer.world = redGL.world;
			camL.autoUpdateMatrix = camR.autoUpdateMatrix = false;
			camL.x = camL.y = camL.z = 10
			camL.lookAt(0, 1, 0)
			camR.x = camR.y = camR.z = 10
			camL.lookAt(0, 1, 0)
			var tUUID = +RedGL.makeUUID()
			var tLeftViewName = 'left' + tUUID
			var tRightViewName = 'right' + tUUID
			world.addView(RedView(tLeftViewName, scene, camL));
			RedView(tLeftViewName).setSize('50%', '100%');
			RedView(tLeftViewName).setLocation('0%', '0%');
			world.addView(RedView('right' + tUUID, scene, camR));
			RedView(tRightViewName).setSize('50%', '100%');
			RedView(tRightViewName).setLocation('50%', '0%');
			////
			scene['postEffectManager'].addEffect(RedPostEffect_Bloom(redGL))
			// scene['postEffectManager'].addEffect(RedPostEffect_Gray(redGL))
			let tMat = RedStandardMaterial(
				redGL,
				RedBitmapTexture(redGL, 'asset/crate.png'),
				RedBitmapTexture(redGL, 'asset/normalTest.jpg'),
				RedBitmapTexture(redGL, 'asset/brick_roughness.jpg')
			)
			let tGeo = RedSphere(redGL, 1, 24, 24, 24)
			let testDLight;
			const setScene = function () {
				let tMesh;
				testDLight = RedDirectionalLight(redGL, '#fff')
				testDLight.x = 3
				testDLight.y = 3
				testDLight.z = 3
				scene.addLight(testDLight);
				testDLight = RedDirectionalLight(redGL, '#ff00ff',0.3)
				testDLight.x = 3
				testDLight.y = 3
				testDLight.z = 3
				scene.addLight(testDLight);
				RedOBJLoader(redGL, 'asset/obj/', 'female.obj', function (v) {
					tMat.shininess = 32
					var max = 10
					var i, j
					i = max
					while ( i-- ) {
						j = 10
						while ( j-- ) {
							tMesh = RedMesh(redGL, tGeo, tMat)
							tMesh.x = Math.sin(Math.PI * 2 / (max - 1) * i) * j * 3
							tMesh.z = Math.cos(Math.PI * 2 / (max - 1) * i) * j * 3 - 10
							tMesh.y = -3
							scene.addChild(tMesh)
						}
					}
					v['resultMesh'].scaleX = v['resultMesh'].scaleY = v['resultMesh'].scaleZ = 0.025
					v['resultMesh'].z = -10
					v['resultMesh'].y = -2
					scene.addChild(v['resultMesh'])
				});
				// scene.grid = RedGrid(redGL);
				scene.skyBox =
					RedSkyBox(redGL, [
						'asset/cubemap/posx.png',
						'asset/cubemap/negx.png',
						'asset/cubemap/posy.png',
						'asset/cubemap/negy.png',
						'asset/cubemap/posz.png',
						'asset/cubemap/negz.png'
					]);
			}
			setScene()
			session.baseLayer = new XRWebGLLayer(session, redGL.gl);
			session.requestFrameOfReference('eyeLevel').then(frameOfRef => {
				const onframe = (t, frame) => {
					const session = frame.session;
					const pose = frame.getDevicePose(frameOfRef);
					if ( pose ) {
						redGL.gl.bindFramebuffer(redGL.gl.FRAMEBUFFER, session.baseLayer.framebuffer);
						redGL.gl.clear(redGL.gl.COLOR_BUFFER_BIT | redGL.gl.DEPTH_BUFFER_BIT);
						for ( const view of frame.views ) {
							const viewport = session.baseLayer.getViewport(view);
							const cam = viewport.x == 0 ? camL : camR;
							cam.perspectiveMTX = view.projectionMatrix;
							cam.matrix = pose.getViewMatrix(view);
						}
						renderer.render(redGL, t);
					}
					let i = scene.children.length
					let tMesh;
					while ( i-- ) {
						tMesh = scene.children[i]
					}
					testDLight.x = Math.sin(t / 500) * 10
					testDLight.y = Math.cos(t / 500) * 10
					testDLight.z = Math.cos(t / 500) * 10
					session.requestAnimationFrame(onframe);
				}
				redGL.setSize(null, null, true)
				session.requestAnimationFrame(onframe);
			});
		};
		const redGL = RedGL(document.querySelector('canvas'), start, {compatibleXRDevice: session.device});
	};
})();