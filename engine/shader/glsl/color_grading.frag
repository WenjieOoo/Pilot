#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

highp vec4 sampleAs3DTexture(sampler2D texture_sampler, highp vec3 uv, highp float width) {
    highp float zSliceSize = 1.0 / width;                                   // 储存一个z格子信息的texture长度
    highp float slicePixelSize = zSliceSize / width;                        // 一个像素的长度  
    highp float sliceInnerSize = slicePixelSize * (width - 1.0);            // 一个z格子内的x信息的映射范围长度
    highp float zSlice0 = min(floor(uv.z * width), width - 1.0);            // z格子位置的向下取整（前z格子）
    highp float zSlice1 = min(zSlice0 + 1.0, width - 1.0);                  // z格子位置的向上取整（后z格子）
    highp float xOffset = slicePixelSize * 0.5 + uv.x * sliceInnerSize;     // 在一个z格子内，x信息的位移
                                                                            //（用0.5 * slicePixelSize，表示第一个像素的中间位置）
    highp float s0 = xOffset + (zSlice0 * zSliceSize);                      // 前z格子内的x位置
    highp float s1 = xOffset + (zSlice1 * zSliceSize);                      // 后z格子内的x位置
    highp vec4 slice0Color = texture(texture_sampler, vec2(s0, uv.y));      // 前z格子内对应的像素点颜色采样
    highp vec4 slice1Color = texture(texture_sampler, vec2(s1, uv.y));      // 后z格子内对应的像素点颜色采样
    highp float zOffset = mod(uv.z * width, 1.0);                           // 前z格子与后z格子的贡献比
    highp vec4 result = mix(slice0Color, slice1Color, zOffset);             // 线性混合两个采样结果
    return result;
}

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    highp float _COLORS      = float(lut_tex_size.y);

    highp vec4 color       = subpassLoad(in_color).rgba;

    highp vec4 gradedPixel = sampleAs3DTexture(color_grading_lut_texture_sampler, color.rgb, _COLORS);

    gradedPixel.a = color.a;

    // out_color = color;
    out_color = gradedPixel;
}