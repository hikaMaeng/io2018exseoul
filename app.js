(_=>{
'use strict';
const polyfill = !navigator.xr ? new WebXRPolyfill() : null;
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
  const canvas = document.querySelector('canvas');
  const red = RedGL(start);
  const start =_=>{
    //red의 화면구성 카메라 기초셋팅등..
    session.baseLayer = new XRWebGLLayer(session, gl);
    session.requestFrameOfReference('eyeLevel').then(frameOfRef=>{
      const onframe = (t, frame)=>{
        const session = frame.session;
        const pose = frame.getDevicePose(frameOfRef);
        if(pose){
          red.clear();
          //gl.bindFramebuffer(gl.FRAMEBUFFER, session.baseLayer.framebuffer);
          //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          for(let view of frame.views){
            let viewport = session.baseLayer.getViewport(view);
            red.viewport();
            red.camera();
            //gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            //view.projectionMatrix, pose.getViewMatrix(view)
            // 카메라생성

          }
        }
        session.requestAnimationFrame(onframe);
      }
      session.requestAnimationFrame(onframe);
    });
  };
};
  
})();