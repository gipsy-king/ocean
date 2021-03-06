#version 300 es
precision highp float;

layout(std140) uniform WaterMaterial_time {
    float time;
};
layout(std140) uniform WaterMaterial_color {
    vec3 color;
};
layout(std140) uniform WaterMaterial_camera {
    vec3 camera;
};

in vec3 v_Normal;
in vec4 v_WorldPosition;
in vec3 v_Position;

out vec4 o_Target;


const vec3 light_direction = normalize(vec3(0.5, 1., 0.5));
const float FADE_DROPOFF = 0.75;

float Voronoi3Tap(vec2 p, float iTime);

void main() {
    float fade = 1. - smoothstep(0.75, 0.9, sqrt(dot(v_Position.xz, v_Position.xz)));

    float specular_intensity = .1;
    vec3 specular = pow(dot(
        normalize((light_direction - v_WorldPosition.xyz)),
        reflect(v_Normal, v_Normal)
    ), specular_intensity) * vec3(1.0, 1.0, 1.0);

    vec3 diffuse = color.rgb * (dot(v_Normal, light_direction));
    float reflection = (sin(gl_FragCoord.y / 2. - time * 10.) * 0.05 * fade + (1. - specular.y)) * 0.2;

    float stripe = smoothstep(0.99, .999, (sin(v_WorldPosition.x * 4.)) * 1.)
      + smoothstep(0.99, .999, (sin(v_WorldPosition.z * 4.)) * 1.);

    float pixelate = .01;
    float c = Voronoi3Tap(pixelate * floor(v_WorldPosition.xz*0.1 / pixelate), time);
    float crest =  pow(c, 10.);
    //smoothstep(0.5, 1.0, pow(c + .2, 10));

    vec3 color = //(vec3(crest, crest, crest))
      vec3(0., 0., 0.)
      + vec3(
          reflection,
          0.,
          crest
        );
    o_Target = vec4(color, fade);
    /* o_Target = vec4(specular, 1.); */
    /* o_Target = vec4(v_Normal / 2., 1); */
    /* o_Target = vec4(color.rgb, 1.); */
}

/*
	3-Tap 2D Voronoi
	----------------

	I saw member BH's hexagonal Voronoi example, which reminded me that I had a 3-tap simplex
	version gathering pixel dust on my harddrive, so here it is.

	I hastily added some coloring and very cheap highlights, just to break the visual monotony, 
	but you can safely ignore most of the code and head straight to the "Voronoi3Tap" function. 
	That's the main point. Like BH's example, this one is branchless. In fact, there's
	virtually no code at all.

	As mentioned below, 3-tap Voronoi is just a novelty, bordering on pointless, but I thought 
	it might provide a basis for anyone wishing to build a 3D simplex version. I also have a 
	4-tap Voronoi function that involves even less computation.

	By the way, the pattern is supposed to be concave. The reason I mention that is, if I stare 
	at a highlighted Voronoi pattern for too long, it sometimes looks inverted. Usually, I have 
	to close my eyes and reopen them to reinvert it. I've often wondered whether that happens to 
	everyone, or whether I'm just getting old. :)

	// Other Shadertoy examples:

	// Hexagonal Voronoi - By "BH."
    // By the way, his version has artifacts, but Dr2 and myself have some hexagonal Voronoi 
    // examples on here that are more robust.
	https://www.shadertoy.com/view/ltjXz1 - I'm looking forward to the finished version. :)

	// Voronoi fast, a 2x2 grid, 4tap version - By "davidbargo":
	https://www.shadertoy.com/view/4tsXRH

*/



// Standard 2x2 hash algorithm.
vec2 hash22(vec2 p, float iTime) { 

    // Faster, but probably doesn't disperse things as nicely as other ways.
    float n = sin(dot(p,vec2(1, 113))); 
    p = fract(vec2(8.*n, n)*262144.);
    return sin(p*6.2831853 + iTime*2.);
    
/* 
	return fract(sin(p)*43758.5453)*2. - 1.;
    
    //p = fract(sin(p)*43758.5453);
	//p = sin(p*6.2831853 + iTime);
    //return sign(p)*.25 + .75*p;
    
    //p = fract(sin(p)*43758.5453)*2. - 1.;
    //return (sign(p)*.25 + p*.75);    
 */   
    
}

// 3-tap Voronoi... kind of. I'm pretty sure I'm not the only one who's thought to try this.
//
// Due to the simplex grid setup, it's probably slightly more expensive than the 4-tap, square 
// grid version, but I believe the staggered cells make the patterns look a little nicer. I'd 
// imagine it's faster than the unrolled 9-tap version, but I couldn't say for sure. Anyway, 
// it's just a novelty, bordering on pointless, but I thought it might interest someone.

// I'm not perfectly happy with the random offset figure of ".125" or the normalization figure 
// of ".425." They might be right, but I'll determine those for sure later. They seem to work.
//
// Credits: Ken Perlin, Brian Sharpe, IQ, various Shadertoy people, etc.
//
float Voronoi3Tap(vec2 p, float iTime){
    
	// Simplex grid stuff.
    //
    vec2 s = floor(p + (p.x + p.y)*.3660254); // Skew the current point.
    p -= s - (s.x + s.y)*.2113249; // Use it to attain the vector to the base vertice (from p).

    // Determine which triangle we're in -- Much easier to visualize than the 3D version. :)
    // The following is equivalent to "float i = step(p.y, p.x)," but slightly faster, I hear.
    float i = p.x<p.y? 0. : 1.;
    
    
    // Vectors to the other two triangle vertices.
    vec2 p1 = p - vec2(i, 1. - i) + .2113249, p2 = p - .5773502; 

    // Add some random gradient offsets to the three vectors above.
    p += hash22(s, iTime)*.125;
    p1 += hash22(s +  vec2(i, 1. - i), iTime)*.125;
    p2 += hash22(s + 1., iTime)*.125;
    
    // Determine the minimum Euclidean distance. You could try other distance metrics, 
    // if you wanted.
    float d = min(min(dot(p, p), dot(p1, p1)), dot(p2, p2))/.425;
   
    // That's all there is to it.
    return sqrt(d); // Take the square root, if you want, but it's not mandatory.

}
