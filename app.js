(_=>{
'use strict';
const polyfill = new WebXRPolyfill();
const xrButton = new XRDeviceButton({
  onRequestSession:device=>device.requestSession({exclusive: true}).then(session=>{
    xrButton.setSession(session);
    session.addEventListener('end', e=>xrButton.setSession(null));
    start(session);
  }),
  onEndSession:session=>session.end()
});
[document.createElement('canvas'), xrButton.domElement].forEach(el=>document.body.appendChild(el));

if(navigator.xr){
  navigator.xr.requestDevice()
    .then(device=>device.supportsSession({exclusive: true}).then(_=>xrButton.setDevice(device)));
}

const start = session=>{
  const start =isOK=>{
    if(!isOK) return console.log('error');

    const world = RedWorld();
    const scene = RedScene(red);
    const renderer = RedRenderer();
    const camL = RedCamera(), camR = RedCamera();

    world.addView(RedView('left', scene, camL));
    RedView('left').setSize('50%', '100%');
		RedView('left').setLocation('50%', '0%');
    world.addView(RedView('right', scene, camR));
    RedView('right').setSize('50%', '100%');
		RedView('right').setLocation('50%', '0%');
    
    scene.grid = RedGrid(red);

    session.baseLayer = new XRWebGLLayer(session, red.gl);
    session.requestFrameOfReference('eyeLevel').then(frameOfRef=>{
      const onframe = (t, frame)=>{
        const session = frame.session;
        const pose = frame.getDevicePose(frameOfRef);
        if(pose){
          red.gl.bindFramebuffer(gl.FRAMEBUFFER, session.baseLayer.framebuffer);
          red.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          for(const view of frame.views){
            const viewport = session.baseLayer.getViewport(view);
            const cam = viewport.x == 0 ? camL : camR;
            cam.perspectiveMTX = view.projectionMatrix;
            cam.matrix = pose.getViewMatrix(view);
          }
          renderer.worldRender(red, t);
          
            //gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            //view.projectionMatrix, pose.getViewMatrix(view)
            // 카메라생성

          
        }
        session.requestAnimationFrame(onframe);
      }
      session.requestAnimationFrame(onframe);
    });
  };
  const red = RedGL(document.querySelector('canvas'), start, {compatibleXRDevice:session.device});
};
  
})();