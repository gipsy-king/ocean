#version 450
layout(location=0) in vec3 Vertex_Position;
layout(location=1) out vec3 Vertex_Normal;
layout(location=2) out vec4 World_Position;
layout(location=3) out vec4 Original_World_Position;
layout(location=4) out vec3 o_Vertex_Position;


layout(set = 0, binding = 0) uniform Camera {
    mat4 ViewProj;
};
layout(set = 1, binding = 0) uniform Transform {
    mat4 Model;
};

void main() {
    mat4 OriginViewProj = ViewProj;

    // I don't know what [3][3] (w?) does
    OriginViewProj[3] = vec4(0., 0., 0., 1.);

    vec4 pos = OriginViewProj * Model * vec4(Vertex_Position, 1.0);
    gl_Position = pos;
}
