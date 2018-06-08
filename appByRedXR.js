var t = document.createElement('canvas')
document.body.appendChild(t)
var testMesh
RedXR(t,
	function (v) {
		console.log(this)
		console.log(v)
		testMesh = RedMesh(this, RedSphere(this), RedColorMaterial(this))
		testMesh.z = -10
		testMesh.drawMode = this.gl.POINTS
		testMesh.pointSize = 5
		v['scene'].addChild(testMesh)
	},
	function (time) {
//			console.log(time)
		testMesh.rotationX += 1
		testMesh.rotationY += 1
		testMesh.rotationZ += 1
	}
)