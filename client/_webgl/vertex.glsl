attribute vec3 position;
varying vec2 uv;

void main(void) {
	gl_Position = vec4(position, 1.0);

	// Interpolate quad coordinates in the fragment shader
	uv = position.xy;
}