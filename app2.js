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
			let tMat = RedEnvironmentMaterial(
				redGL,
				RedBitmapTexture(redGL, 'asset/crate.png'),
				RedBitmapCubeTexture(redGL, [
					'asset/cubemap/posx.png',
					'asset/cubemap/negx.png',
					'asset/cubemap/posy.png',
					'asset/cubemap/negy.png',
					'asset/cubemap/posz.png',
					'asset/cubemap/negz.png'
				])
				, RedBitmapTexture(redGL, 'asset/normalTest.jpg')
				, RedBitmapTexture(redGL, 'asset/specular.png')
				, RedBitmapTexture(redGL, 'asset/displacementTest.jpg')
			)
			let tGeo = RedSphere(redGL, 0.1, 32, 32, 32)
			let testParticle;
			const setScene = function () {
				let i = 10
				let tMesh;
				let testDLight;
				testDLight = RedDirectionalLight(redGL, '#fff')
				testDLight.x = 3
				testDLight.y = 3
				testDLight.z = 3
				scene.addLight(testDLight)
				while ( i-- ) {
					tMesh = RedMesh(redGL, tGeo, tMat)
					tMesh.x = Math.sin(Math.PI * 2 / 10 * i) * 3
					tMesh.y = Math.cos(Math.PI * 2 / 10 * i) * 3
					tMesh.z = -10
					scene.addChild(tMesh)
				}
				tMesh = RedMesh(redGL, RedSphere(redGL, 1, 32, 32, 32), tMat)
				tMesh.z = -10
				scene.addChild(tMesh);
				// 포인트 클라우드
				(function () {
					let testMaterial
					let interleaveData;
					testMaterial = RedPointBitmapMaterial(redGL, RedBitmapTexture(redGL, 'asset/particle.png'))
					interleaveData = []
					let i = 100000
					while ( i-- ) {
						interleaveData.push(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50)
						interleaveData.push( Math.random() * 50 )
					}
					interleaveData = new Float32Array(interleaveData)
					testParticle = RedPointUnit(
						redGL,
						interleaveData,
						[
							RedInterleaveInfo( 'aVertexPosition', 3 ),
							RedInterleaveInfo( 'aPointSize', 1 )
						],
						testMaterial
					)
					testParticle['useDepthTest'] = false
					testParticle['blendSrc'] = redGL.gl.SRC_ALPHA
					testParticle['blendDst'] = redGL.gl.ONE
					scene.addChild(testParticle)
				})();
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
						}
						renderer.render(redGL, t);
					}
					tMat['displacementPower'] = Math.sin(t / 250) / 2
					let i = scene.children.length
					let tMesh;
					while ( i-- ) {
						tMesh = scene.children[i]
						if(tMesh == testParticle){

						}else{
							tMesh.rotationX += 1
							tMesh.rotationY += 1
							tMesh.rotationZ += 1
						}

					}
					session.requestAnimationFrame(onframe);
				}
				session.requestAnimationFrame(onframe);
			});
		};
		const redGL = RedGL(document.querySelector('canvas'), start, {compatibleXRDevice: session.device});
	};
})();