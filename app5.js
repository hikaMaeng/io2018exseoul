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
			const tUUID = +RedGL.makeUUID()
			const tLeftViewName = 'left' + tUUID
			const tRightViewName = 'right' + tUUID
			world.addView(RedView(tLeftViewName, scene, camL));
			RedView(tLeftViewName).setSize('50%', '100%');
			RedView(tLeftViewName).setLocation('0%', '0%');
			world.addView(RedView('right' + tUUID, scene, camR));
			RedView(tRightViewName).setSize('50%', '100%');
			RedView(tRightViewName).setLocation('50%', '0%');
			////
			scene['postEffectManager'].addEffect(RedPostEffect_Bloom(redGL))
			let tMat = RedStandardMaterial(
				redGL,
				RedBitmapTexture(redGL, 'asset/crate.png'),
				RedBitmapTexture(redGL, 'asset/normalTest.jpg')
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
				testDLight = RedDirectionalLight(redGL, '#ff00ff', 0.3)
				testDLight.x = 3
				testDLight.y = 3
				testDLight.z = 3
				scene.addLight(testDLight);
				let i = 1000
				while ( i-- ) {
					tMesh = RedMesh(redGL, tGeo, tMat)
					tMesh.x = Math.random() * 100 - 50
					tMesh.z = Math.random() * 100 - 50
					tMesh.y = Math.random() * 100 - 50
					tMesh.scaleX = tMesh.scaleY = tMesh.scaleZ = Math.random() * 2 + 1
					scene.addChild(tMesh)
				}
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
			redGL.fullMode = false
			session.baseLayer = new XRWebGLLayer(session, redGL.gl);
			session.requestFrameOfReference('eyeLevel').then(frameOfRef => {
				const onframe = (t, frame) => {
					const session = frame.session;
					const pose = frame.getDevicePose(frameOfRef);
					t = performance.now()
					if ( pose ) {
						redGL.gl.bindFramebuffer(redGL.gl.FRAMEBUFFER, session.baseLayer.framebuffer);
						redGL.gl.clear(redGL.gl.COLOR_BUFFER_BIT | redGL.gl.DEPTH_BUFFER_BIT);
						for ( const view of frame.views ) {
							const viewport = session.baseLayer.getViewport(view);
							const cam = viewport.x == 0 ? camL : camR;
							const viewName = viewport.x == 0 ? tLeftViewName : tRightViewName
							RedView(viewName).setSize(viewport.width, viewport.height)
							RedView(viewName).setLocation(viewport.x, viewport.y)
							cam.perspectiveMTX = view.projectionMatrix;
							cam.matrix = pose.getViewMatrix(view);
							const t0 = [
								Math.sin(t / 1500) * 35,
								Math.cos(t / 1500) * 35,
								Math.cos(t / 1500) * 35 + Math.sin(t / 500) * 25
							]
							cam.x = t0[0]
							cam.y = t0[1]
							cam.z = t0[2]
							mat4.translate(cam.matrix, cam.matrix, t0)
							// cam.lookAt(0,0,0)
						}
						renderer.render(redGL, t);
					}
					let i = scene.children.length
					let tMesh;
					while ( i-- ) {
						tMesh = scene.children[i]
					}
					testDLight.x = Math.sin(t / 500) * 20 - 10
					testDLight.y = Math.cos(t / 500) * 20 - 10
					testDLight.z = Math.cos(t / 500) * 20 - 10
					session.requestAnimationFrame(onframe);
				}
				session.requestAnimationFrame(onframe);
			});
		};
		const redGL = RedGL(document.querySelector('canvas'), start, {compatibleXRDevice: session.device});
	};
})();