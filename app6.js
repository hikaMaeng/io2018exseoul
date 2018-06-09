(_ => {
	'use strict';
	const log = v => {
		const div = document.createElement('div');
		div.innerHTML = v;
		div.style.cssText = 'position:absolute;top:0px;left:0px;z-index:10;background:#fff'
		document.body.appendChild(div);
	}
	const polyfill = new WebXRPolyfill();
	const cvs = document.createElement('canvas');
	const xrButton = new XRDeviceButton({
		onRequestSession: device => device.requestSession({ exclusive: true }).then(session => {
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
	if (navigator.xr) {
		navigator.xr.requestDevice()
			.then(device => device.supportsSession({ exclusive: true }).then(_ => xrButton.setDevice(device)));
	}
	const start = session => {
		const start = isOK => {
			if (!isOK) return console.log('error');
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
			let tMat2 = RedStandardMaterial(
				redGL,
				RedBitmapTexture(redGL, 'asset/crate.png'),
				RedBitmapTexture(redGL, 'asset/normalTest.jpg')
			)
			let tGeo = RedSphere(redGL, 0.1, 32, 32, 32)
			let tGeo2 = RedSphere(redGL, 1, 32, 32, 32)
			let testParticle;

			const grip = RedMesh(redGL, RedSphere(redGL, 0.3, 32, 32, 32), RedColorPhongMaterial(redGL));
			grip['autoUpdateMatrix'] = false
			scene.addChild(grip);
			const gripGoal = RedMesh(redGL, tGeo, RedColorPhongMaterial(redGL, '#00ff00'));
			gripGoal['autoUpdateMatrix'] = false
			scene.addChild(gripGoal);

			const line = RedLine(redGL, RedColorMaterial(redGL))
			scene.addChild(line)
			line.drawMode = redGL.gl.LINES

			const setScene = function () {
				let i = 10
				let tMesh;
				let testDLight;

				testDLight = RedDirectionalLight(redGL, '#fff')
				testDLight.x = 3
				testDLight.y = 3
				testDLight.z = 3
				scene.addLight(testDLight);

				testDLight = RedDirectionalLight(redGL, '#ff00ff')
				testDLight.x = -3
				testDLight.y = -3
				testDLight.z = -3
				scene.addLight(testDLight);

				testDLight = RedDirectionalLight(redGL, '#00ff00')
				testDLight.x = 3
				testDLight.y = -3
				testDLight.z = -3
				scene.addLight(testDLight);

				// 포인트 클라우드
				// (function () {
				// 	let testMaterial
				// 	let interleaveData;
				// 	testMaterial = RedPointBitmapMaterial(redGL, RedBitmapTexture(redGL, 'asset/particle.png'))
				// 	interleaveData = []
				// 	let i = 100000
				// 	while (i--) {
				// 		interleaveData.push(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250)
				// 		interleaveData.push(Math.random() * 8)
				// 	}
				// 	interleaveData = new Float32Array(interleaveData)
				// 	testParticle = RedPointUnit(
				// 		redGL,
				// 		interleaveData,
				// 		[
				// 			RedInterleaveInfo('aVertexPosition', 3),
				// 			RedInterleaveInfo('aPointSize', 1)
				// 		],
				// 		testMaterial
				// 	)
				// 	testParticle['useDepthTest'] = false
				// 	testParticle['blendSrc'] = redGL.gl.SRC_ALPHA
				// 	testParticle['blendDst'] = redGL.gl.ONE
				// 	scene.addChild(testParticle)



				// })();
				(function () {
					let testMaterial
					testMaterial = RedPointColorMaterial(redGL)
					let interleaveData, interleaveData2
					interleaveData = []
					let i = 10000
					while (i--) {
						let t = Math.random() * 100 - 50
						interleaveData.push(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500)
						interleaveData.push(Math.random() * 5)
						interleaveData.push(Math.random(), Math.random(), Math.random(), 1)
					}
					interleaveData = new Float32Array(interleaveData)
					testParticle = RedPointUnit(
						redGL,
						interleaveData,
						[
							RedInterleaveInfo('aVertexPosition', 3),
							RedInterleaveInfo('aPointSize', 1),
							RedInterleaveInfo('aVertexColor', 4)
						],
						testMaterial
					)
					scene.addChild(testParticle)
				})();

				i = 10
				while (i--) {
					tMesh = RedMesh(redGL, tGeo, tMat)
					tMesh.x = Math.sin(Math.PI * 2 / 10 * i) * 3
					tMesh.y = Math.cos(Math.PI * 2 / 10 * i) * 3
					tMesh.z = -10
					scene.addChild(tMesh)
				}
				tMesh = RedMesh(redGL, RedSphere(redGL, 1, 32, 32, 32), tMat)
				tMesh.z = -10
				scene.addChild(tMesh);


				i = 200
				while (i--) {
					tMesh = RedMesh(redGL, tGeo2, tMat2)
					tMesh.x = Math.random() * 1000 - 500
					tMesh.z = Math.random() * 1000 - 500
					tMesh.y = Math.random() * 1000 - 500
					tMesh.scaleX = tMesh.scaleY = tMesh.scaleZ = Math.random() * 25 + 10
					scene.addChild(tMesh)
				}

		
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


			const se = session

			let prevPosition = [0, 0, 0]
			session.requestFrameOfReference('eyeLevel').then(frameOfRef => {
				const onframe = (t, frame) => {
					const session = frame.session;
					const pose = frame.getDevicePose(frameOfRef);
					t = performance.now()
					if (pose) {
						redGL.gl.bindFramebuffer(redGL.gl.FRAMEBUFFER, session.baseLayer.framebuffer);
						redGL.gl.clear(redGL.gl.COLOR_BUFFER_BIT | redGL.gl.DEPTH_BUFFER_BIT);
						for (const view of frame.views) {
							const viewport = session.baseLayer.getViewport(view);
							const cam = viewport.x == 0 ? camL : camR;
							const viewName = viewport.x == 0 ? tLeftViewName : tRightViewName
							RedView(viewName).setSize(viewport.width, viewport.height)
							RedView(viewName).setLocation(viewport.x, viewport.y)
							cam.perspectiveMTX = view.projectionMatrix;
							cam.matrix = pose.getViewMatrix(view);

							const direction = [cam.matrix[7], cam.matrix[11], cam.matrix[15]]
							vec3.normalize(direction, direction)
							const locationMtx = mat4.create()
							locationMtx[12] = prevPosition[0] + direction[0]
							locationMtx[13] = prevPosition[1] + direction[1]
							locationMtx[14] = prevPosition[2] + direction[2]



							mat4.multiply(cam.matrix, locationMtx, cam.matrix)

							prevPosition[0] = cam.matrix[12]
							prevPosition[1] = cam.matrix[13]
							prevPosition[2] = cam.matrix[14]
						}


						let inputSources = se.getInputSources();
						for (let xrInputSource of inputSources) {
							let inputPose = frame.getInputPose(xrInputSource, frameOfRef);
							if (inputPose) {
								if (inputPose.gripMatrix) {
									grip.matrix = inputPose.gripMatrix;
								}
								if (inputPose.pointerMatrix) {
									gripGoal.matrix = inputPose.pointerMatrix;
								}
							}
						}

						line.removeAllPoint()
						line.addPoint(grip.matrix[12], grip.matrix[13], grip.matrix[14])
						line.addPoint(gripGoal.matrix[12], gripGoal.matrix[13], gripGoal.matrix[14])
						renderer.render(redGL, t);
					}

					tMat['displacementPower'] = Math.sin(t / 250) / 2
					let i = scene.children.length
					let tMesh;
					while (i--) {
						tMesh = scene.children[i]
						if (testParticle == tMesh) {
							tMesh.rotationX += 0.01
							tMesh.rotationY += 0.01
							tMesh.rotationZ += 0.01
						} else {
							tMesh.rotationX += 1
							tMesh.rotationY += 1
							tMesh.rotationZ += 1
						}

					}
					let pointLights = scene['_lightInfo']['RedDirectionalLight']
					i = pointLights.length
					while (i--) {
						pointLights[i].x = Math.sin(t / 6000 + Math.PI * 2 / pointLights.length * i) * 40
						pointLights[i].y = Math.tan(t / 3000 + Math.PI * 2 / pointLights.length * i) * 10 +
							Math.atan(t / 2000 + Math.PI * 2 / pointLights.length * i) * 10
						pointLights[i].z = Math.cos(t / 2500 + Math.PI * 2 / pointLights.length * i) * 60
					}



					session.requestAnimationFrame(onframe);
				}
				session.requestAnimationFrame(onframe);
			});
		};
		const redGL = RedGL(document.querySelector('canvas'), start, { compatibleXRDevice: session.device });
	};
})();