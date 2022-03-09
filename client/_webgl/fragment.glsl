precision mediump float;

// The interpolated quad coordinates from [-1, 1] on the x and y axis
varying vec2 uv;

// Camera uniforms
uniform vec2 g_resolution;
uniform vec3 g_camUp;
uniform vec3 g_camRight;
uniform vec3 g_camForward;
uniform vec3 g_eye;

// Array of positions of bodies to render
uniform vec3 g_bodyPositions[10];

// Constants
const float g_focalLength = 1.97; // Distance between the eye and the image plane
const float g_zNear = 0.0; // Near clip depth
const float g_zFar = 100.0; // Far clip depth
const int g_rmSteps = 512; // Max raymarch steps
const float g_rmEpsilon = 0.001; // Surface threshold
const vec4 g_skyColor = vec4(0.31, 0.47, 0.67, 1.0);
const vec4 g_ambient = vec4(0.15, 0.2, 0.32, 1.0);

// Maps x from [minX, maxX] to [minY, maxY], without clamping
float mapTo(float x, float minX, float maxX, float minY, float maxY)
{
	float a = (maxY - minY) / (maxX - minX);
	float b = minY - a * minX;
	return a * x + b;
}

// Returns the unsigned distance estimate to a box of the given size
float udBox(vec3 p, vec3 size)
{
	return length(max(abs(p) - size, vec3(0.0)));
}

// Returns the signed distance estimate to a box of the given size
float sdBox(vec3 p, vec3 size)
{
	vec3 d = abs(p) - size;
	return min(max(d.x, max(d.y, d.z)), 0.0) + udBox(p, size);
}

float sdSphere(vec3 p, float radius)
{
	return length(p) - radius;
}

float locatedSphere(vec3 p, vec3 location, float radius) {
  return distance(p, location) - radius;
}

// Subtracts distance field db from da, where db is a signed distance
float opSubtract(float da, float db)
{
	return max(da, -db);
}

// Returns the closest distance to a surface from p in our scene
float distScene(vec3 p)
{
	// Cool sphere fractal
	//float db = sdSphere(p, 2.0);
	//p.xyz = mod(p.xyz, 0.5) - vec3(0.25);
	//float d1 = opSubtract(db, sdBox(p, vec3(0.2)));
  //float d1 = sdSphere(vec3(0.0, -2.0, 0.0), 1.0);

  float d1 = 999.0;

  for(int i = 0; i < 10; i++) {
    float body = locatedSphere(p, g_bodyPositions[i], 1.0);
    if(body < d1) {
      d1 = body;
    }
  }

	return d1;

	// Repeated spheres
	/*p.xyz = mod(p.xyz, 1.0) - vec3(0.5);
	return sdSphere(p, 0.25);*/

  // bomb + rubix cube
	/*float d0 = sdSphere(p - vec3(0, 0.6, 0), 1.5);
	float d1 = sdBox(p - vec3(-1.8, 0.25, 0), vec3(0.8));

	vec3 q = p;
	q.xyz = mod(p.xyz, 1.0) - vec3(0.5);
	float extrusionField0 = sdBox(q, vec3(0.28));

  vec3 r = p;
	r.xyz = mod(p.xyz, 0.5) - vec3(0.25);
	float extrusionField1 = sdSphere(r, 0.125);

	float df = min(d0, d1);
	float df0 = max(df, extrusionField0);
	float df1 = min(df0, df + 0.2);
	return df1;*/
  
  //return sdSphere(p, 0.25);

	/*float da = sdBox(p - vec3(4.0, 0.5, 0.3), vec3(2.0));
	float d1 = opSubtract(db, sdSphere(p, 0.32));
	float d1 = opSubtract(ds, sdBox(p, vec3(0.2)));
	float d2 = opSubtract(da, sdSphere(p, 0.3));
	float d2 = sdBox(p - vec3(0, -0.5, 0), vec3(2.0, 0.5, 2.0));
	return min(d1, d2);*/
}

// Approximates the (normalized) gradient of the distance function at the given point.
// If p is near a surface, the function will approximate the surface normal.
vec3 getNormal(vec3 p)
{
	float h = 0.0001;

	return normalize(vec3(
		distScene(p + vec3(h, 0, 0)) - distScene(p - vec3(h, 0, 0)),
		distScene(p + vec3(0, h, 0)) - distScene(p - vec3(0, h, 0)),
		distScene(p + vec3(0, 0, h)) - distScene(p - vec3(0, 0, h))));
}

// Returns a value between 0 and 1 depending on how visible p0 is from p1
// 0 means it's completely blocked, 1 means completely visible
// k defines the hardness of the shadow
float getShadow(vec3 p0, vec3 p1, float k)
{
	vec3 rd = normalize(p1 - p0);
	float t = 10.0 * g_rmEpsilon; // Start a bit away from the surface
	float maxt = length(p1 - p0);
	float f = 1.0;
	for(int i = 0; i < g_rmSteps; ++i)
	{
		float d = distScene(p0 + rd * t);

		// A surface was hit before we reached p1
		if(d < g_rmEpsilon)
			return 0.0;

		// Penumbra factor is calculated based on how close we were to
		// the surface, and how far away we are from the shading point
		// See http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
		f = min(f, k * d / t);

		t += d;

		// We reached p1
		if(t >= maxt)
			break;
	}

	return f;
}

// Calculate the light intensity with soft shadows
// p: point on surface
// lightPos: position of the light source
// lightColor: the radiance of the light source
// returns: the color of the point
vec4 getShading(vec3 p, vec3 normal, vec3 lightPos, vec4 lightColor)
{
	float lightIntensity = 0.0;
	float shadow = getShadow(p, lightPos, 16.0);
	if(shadow > 0.0) // If we are at all visible
	{
		vec3 lightDirection = normalize(lightPos - p);
		lightIntensity = shadow * clamp(dot(normal, lightDirection), 0.0, 1.0);
	}
	
	return lightColor * lightIntensity + g_ambient * (1.0 - lightIntensity);
}

// Marches along a ray using the distance field, until an intersection is found
// i: iteration count
// t: distance traveled along ray
void raymarch(vec3 ro, vec3 rd, out int i, out float t)
{
	t = 0.0;
	for(int j = 0; j < g_rmSteps; ++j)
	{
		vec3 p = ro + rd * t;
		float d = distScene(p);
		if(d < g_rmEpsilon || t > g_zFar)
		{
			i = j;
			break;
		}
		t += d;
	}
}

// Compute an ambient occlusion factor
// p: point on surface
// n: normal of the surface at p
// returns: a value clamped to [0, 1], where 0 means there were no other surfaces around the point,
// and 1 means that the point is occluded by other surfaces.
float ambientOcclusion(vec3 p, vec3 n)
{
	float stepSize = 0.01;
	float t = stepSize;
	float oc = 0.0;
	for(int i = 0; i < 10; ++i)
	{
		float d = distScene(p + n * t);
		oc += t - d; // Actual distance to surface - distance field value
		t += stepSize;
	}

	return clamp(oc, 0.0, 1.0);
}

// Create a checkboard texture
vec4 getFloorTexture(vec3 p)
{
	vec2 m = mod(p.xz, 2.0) - vec2(1.0);
  float r = p.x > 0.0 ? 0.1 : 1.0;
  float g = p.z > 0.0 ? 0.1 : 1.0;
  float b = r == 1.0 || g == 1.0 ? 0.1 : 1.0;
	return m.x * m.y > 0.0 ? vec4(0.1) : vec4(r, g, b, 0.1);
}

// To improve performance we raytrace the floor
// n: floor normal
// o: floor position
float raytraceFloor(vec3 ro, vec3 rd, vec3 n, vec3 o)
{
	return dot(o - ro, n) / dot(rd, n);
}

// Computes the color corresponding to the ray intersection point (if any)
vec4 computeColor(vec3 ro, vec3 rd)
{
	float t0;
	int i;
	raymarch(ro, rd, i, t0);

	vec3 floorNormal = vec3(0, 1, 0);
	float t1 = raytraceFloor(ro, rd, floorNormal, vec3(0, -0.5, 0));

	vec3 p; // Surface point
	vec3 normal; // Surface normal
	float t; // Distance traveled by ray from eye
	vec4 texture = vec4(1.0); // Surface texture

	if(t1 < t0 && t1 >= g_zNear && t1 <= g_zFar) // The floor was closest
	{
		t = t1;
		p = ro + rd * t1;
		normal = floorNormal;
		texture = getFloorTexture(p);
	}
	else if(i < g_rmSteps && t0 >= g_zNear && t0 <= g_zFar) // Raymarching hit a surface
	{
		t = t0;
		p = ro + rd * t0;
		normal = getNormal(p);
	}
	else
	{
		return g_skyColor;
	}

	vec4 color;
	float z = mapTo(t, g_zNear, g_zFar, 1.0, 0.0);

	// Color based on depth
	//color = vec4(1.0) * z;

	// Diffuse lighting
	color = texture * (
		getShading(p, normal, vec3(0, 4, 0), vec4(0.67, 0.87, 0.93, 1.0)) +
		getShading(p, normal, vec3(2.0, 3.0, 0.0), vec4(1.0, 0.5, 0.5, 1.0))
		) / 2.0;

	// Color based on surface normal
	//color = vec4(abs(normal), 1.0);

	// Blend in ambient occlusion factor
	float ao = ambientOcclusion(p, normal);
	color = color * (1.0 - ao);

	// Blend the background color based on the distance from the camera
	float zSqrd = z * z;
	color = mix(g_skyColor, color, zSqrd * (3.0 - 2.0 * z)); // Fog

	return color;
}

void main(void) {
	float aspectRatio = g_resolution.x / g_resolution.y;
	vec3 ro = g_eye;
	vec3 rd = normalize(g_camForward * g_focalLength + g_camRight * uv.x * aspectRatio + g_camUp * uv.y);

	vec4 color = computeColor(ro, rd);

	// 4xAA
	/*vec2 hps = vec2(1.0) / (g_resolution * 2.0);
	vec3 rd0 = normalize(g_camForward * g_focalLength + g_camRight * (uv.x - hps.x) * aspectRatio + g_camUp * uv.y);
	vec3 rd1 = normalize(g_camForward * g_focalLength + g_camRight * (uv.x + hps.x) * aspectRatio + g_camUp * uv.y);
	vec3 rd2 = normalize(g_camForward * g_focalLength + g_camRight * uv.x * aspectRatio + g_camUp * (uv.y - hps.y));
	vec3 rd3 = normalize(g_camForward * g_focalLength + g_camRight * uv.x * aspectRatio + g_camUp * (uv.y + hps.y));

	vec4 color = (computeColor(ro, rd0) + computeColor(ro, rd1) + computeColor(ro, rd2) + computeColor(ro, rd3)) / 4.0;
  */

	gl_FragColor = vec4(color.xyz, 1.0);
}