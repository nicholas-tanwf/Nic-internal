"""
Exhale intro render (Blender 5.x)

Generates an original chrome/glass blob morph animation:
- 6s @ 60fps (360 frames)
- orange-dominant with subtle green/yellow tints
- portrait 9:16

Usage (headless):
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/exhale_intro_render.py -- \
    --out /abs/path/to/react-vite/public/intro/exhale-intro.mp4
"""

import argparse
import math
import os
import sys

import bpy


def arg_after_double_dash():
  # Blender mixes its own CLI args into argv; the conventional way is to read sys.argv
  argv = list(sys.argv)
  if "--" not in argv:
    return []
  return argv[argv.index("--") + 1 :]


def parse_args():
  p = argparse.ArgumentParser()
  p.add_argument("--out", required=True, help="Output MP4 path")
  p.add_argument("--w", type=int, default=720, help="Width (portrait render is w x h)")
  p.add_argument("--h", type=int, default=1280, help="Height")
  p.add_argument("--samples", type=int, default=96, help="Eevee samples")
  return p.parse_args(arg_after_double_dash())


def clean_scene():
  # Avoid read_factory_settings(): in headless mode it can disable FFmpeg output assignment.
  # Instead, clear the current startup scene contents.
  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete(use_global=False)
  # Remove orphan data blocks (best-effort).
  for collection in list(bpy.data.collections):
    if collection.users == 0:
      bpy.data.collections.remove(collection)
  for mesh in list(bpy.data.meshes):
    if mesh.users == 0:
      bpy.data.meshes.remove(mesh)
  for mat in list(bpy.data.materials):
    if mat.users == 0:
      bpy.data.materials.remove(mat)


def set_render(scene, *, out_path, w, h, fps, samples):
  # Prefer Eevee Next (fast + decent glass look); fall back if needed.
  engine = "BLENDER_EEVEE_NEXT"
  if engine not in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys():
    engine = "BLENDER_EEVEE"
  scene.render.engine = engine

  scene.render.resolution_x = w
  scene.render.resolution_y = h
  scene.render.resolution_percentage = 100
  scene.render.fps = fps
  scene.frame_start = 1
  scene.frame_end = fps * 6

  # Output MP4 (H.264)
  # NOTE: setting image_settings.file_format='FFMPEG' can fail in headless mode on some setups.
  # We set the format via Blender CLI: `-F FFMPEG`, and only configure ffmpeg settings here.
  scene.render.ffmpeg.format = "MPEG4"
  scene.render.ffmpeg.codec = "H264"
  scene.render.ffmpeg.constant_rate_factor = "HIGH"
  scene.render.ffmpeg.ffmpeg_preset = "GOOD"
  scene.render.ffmpeg.gopsize = fps
  scene.render.ffmpeg.video_bitrate = 6000
  scene.render.ffmpeg.max_b_frames = 2
  scene.render.filepath = out_path
  scene.render.use_file_extension = True

  # Eevee quality
  ee = scene.eevee
  ee.taa_render_samples = samples
  ee.taa_samples = min(32, samples)

  # Blender 5.x Eevee Next: use raytracing options (bloom/ssr/gtao names changed).
  ee.use_raytracing = True
  ee.ray_tracing_method = "SCREEN"
  ee.use_shadows = True
  try:
    rt = ee.ray_tracing_options
    rt.use_denoise = True
    # Faster while still looking premium.
    rt.resolution_scale = 0.5
    rt.screen_trace_quality = 1.0
    rt.screen_trace_thickness = 0.45
    rt.trace_max_roughness = 0.25
  except Exception:
    pass

  # Volumetrics for vivid internal color swirls.
  ee.use_volumetric_shadows = True
  ee.volumetric_samples = 64
  ee.volumetric_shadow_samples = 32
  ee.volumetric_start = 0.02
  ee.volumetric_end = 30.0
  ee.volumetric_light_clamp = 0.0

  # Film
  scene.render.film_transparent = False
  # Blender 5 uses AgX looks by default.
  scene.view_settings.look = "AgX - Very High Contrast"
  scene.view_settings.exposure = 0.2
  scene.view_settings.gamma = 1.0


def make_camera(scene):
  bpy.ops.object.camera_add(location=(0.0, -3.2, 0.25), rotation=(math.radians(86), 0, 0))
  cam = bpy.context.active_object
  cam.data.lens = 70
  scene.camera = cam
  return cam


def make_lights():
  # Key light (orange)
  bpy.ops.object.light_add(type="AREA", location=(1.4, -1.1, 2.2))
  key = bpy.context.active_object
  key.data.energy = 1200
  key.data.size = 2.4
  key.data.color = (1.0, 0.55, 0.2)

  # Fill (cool white)
  bpy.ops.object.light_add(type="AREA", location=(-1.2, -1.4, 1.6))
  fill = bpy.context.active_object
  fill.data.energy = 520
  fill.data.size = 3.0
  fill.data.color = (0.9, 0.95, 1.0)

  # Rim (sharp highlight)
  bpy.ops.object.light_add(type="AREA", location=(0.0, 1.8, 1.9))
  rim = bpy.context.active_object
  rim.data.energy = 700
  rim.data.size = 1.3
  rim.data.color = (1.0, 1.0, 1.0)


def make_floor():
  bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -1.05))
  floor = bpy.context.active_object
  mat = bpy.data.materials.new("ExhaleFloor")
  mat.use_nodes = True
  nodes = mat.node_tree.nodes
  for n in list(nodes):
    nodes.remove(n)
  out = nodes.new("ShaderNodeOutputMaterial")
  bsdf = nodes.new("ShaderNodeBsdfPrincipled")
  bsdf.inputs["Base Color"].default_value = (0.03, 0.03, 0.03, 1.0)
  bsdf.inputs["Roughness"].default_value = 0.18
  # Blender 5 Principled uses "Specular IOR Level"
  bsdf.inputs["Specular IOR Level"].default_value = 0.55
  bsdf.inputs["Metallic"].default_value = 0.0
  mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
  floor.data.materials.append(mat)
  return floor


def make_glass_blob(scene):
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=1.0, location=(0, 0, 0))
  obj = bpy.context.active_object
  obj.name = "ExhaleBlob"

  # Smooth shading
  bpy.ops.object.shade_smooth()

  # Subdivision (extra smooth)
  sub = obj.modifiers.new("Subdiv", "SUBSURF")
  sub.levels = 2
  sub.render_levels = 3

  # Displace modifier with animated noise (creates morphing)
  disp = obj.modifiers.new("Warp", "DISPLACE")
  tex = bpy.data.textures.new("ExhaleNoise", type="CLOUDS")
  tex.noise_scale = 0.58
  tex.noise_depth = 3
  disp.texture = tex
  disp.strength = 0.28

  # Animate warping intensity (more dynamic than the first version)
  disp.keyframe_insert(data_path="strength", frame=1)
  disp.strength = 0.46
  disp.keyframe_insert(data_path="strength", frame=90)
  disp.strength = 0.32
  disp.keyframe_insert(data_path="strength", frame=180)
  disp.strength = 0.52
  disp.keyframe_insert(data_path="strength", frame=270)
  disp.strength = 0.34
  disp.keyframe_insert(data_path="strength", frame=360)

  # Second displace layer (finer detail for “blobby” morphs)
  disp2 = obj.modifiers.new("WarpFine", "DISPLACE")
  tex2 = bpy.data.textures.new("ExhaleNoiseFine", type="MUSGRAVE")
  tex2.musgrave_type = "RIDGED_MULTIFRACTAL"
  tex2.noise_scale = 1.65
  disp2.texture = tex2
  disp2.strength = 0.08
  disp2.keyframe_insert(data_path="strength", frame=1)
  disp2.strength = 0.14
  disp2.keyframe_insert(data_path="strength", frame=180)
  disp2.strength = 0.10
  disp2.keyframe_insert(data_path="strength", frame=360)

  # Add slight rotation for “3D turn”
  obj.rotation_euler = (math.radians(12), math.radians(-22), math.radians(-8))
  obj.keyframe_insert(data_path="rotation_euler", frame=1)
  obj.rotation_euler = (math.radians(22), math.radians(26), math.radians(14))
  obj.keyframe_insert(data_path="rotation_euler", frame=180)
  obj.rotation_euler = (math.radians(12), math.radians(-10), math.radians(6))
  obj.keyframe_insert(data_path="rotation_euler", frame=360)

  # Material: chrome-glass with orange dominance and subtle green/yellow absorption
  mat = bpy.data.materials.new("ExhaleGlass")
  mat.use_nodes = True
  mat.blend_method = "HASHED"
  mat.use_screen_refraction = True
  mat.use_raytrace_refraction = True
  mat.refraction_depth = 0.55
  nodes = mat.node_tree.nodes
  links = mat.node_tree.links
  for n in list(nodes):
    nodes.remove(n)

  out = nodes.new("ShaderNodeOutputMaterial")
  principled = nodes.new("ShaderNodeBsdfPrincipled")
  principled.inputs["Base Color"].default_value = (0.95, 0.97, 1.0, 1.0)
  principled.inputs["Metallic"].default_value = 0.12  # a bit more chrome
  principled.inputs["Specular IOR Level"].default_value = 0.85
  principled.inputs["Roughness"].default_value = 0.035
  principled.inputs["Transmission Weight"].default_value = 1.0
  principled.inputs["IOR"].default_value = 1.52
  principled.inputs["Coat Weight"].default_value = 0.30
  principled.inputs["Coat Roughness"].default_value = 0.06

  # More transparent overall (lower absorption), but vivid swirling internal color via emission.
  vol_abs = nodes.new("ShaderNodeVolumeAbsorption")
  vol_abs.inputs["Color"].default_value = (1.0, 0.45, 0.12, 1.0)  # orange dominance
  vol_abs.inputs["Density"].default_value = 0.07

  texcoord = nodes.new("ShaderNodeTexCoord")
  mapping = nodes.new("ShaderNodeMapping")
  mapping.inputs["Scale"].default_value = (2.2, 2.2, 2.2)
  noise = nodes.new("ShaderNodeTexNoise")
  noise.inputs["Scale"].default_value = 3.2
  noise.inputs["Detail"].default_value = 7.0
  noise.inputs["Roughness"].default_value = 0.55

  ramp = nodes.new("ShaderNodeValToRGB")
  # orange / yellow / green vivid ramp
  ramp.color_ramp.elements[0].position = 0.20
  ramp.color_ramp.elements[0].color = (1.0, 0.35, 0.08, 1.0)  # deep orange
  e1 = ramp.color_ramp.elements.new(0.58)
  e1.color = (1.0, 0.90, 0.12, 1.0)  # yellow
  e2 = ramp.color_ramp.elements.new(0.82)
  e2.color = (0.16, 1.0, 0.55, 1.0)  # green

  # Blender 5: use Principled Volume for emissive volumetrics.
  vol_emit = nodes.new("ShaderNodeVolumePrincipled")
  vol_emit.inputs["Density"].default_value = 0.0
  vol_emit.inputs["Emission Strength"].default_value = 3.5

  add_vol = nodes.new("ShaderNodeAddShader")
  links.new(vol_abs.outputs["Volume"], add_vol.inputs[0])
  links.new(vol_emit.outputs["Volume"], add_vol.inputs[1])

  # Wiring for swirling: object coords -> mapping (animated) -> noise -> ramp -> emission color
  links.new(texcoord.outputs["Object"], mapping.inputs["Vector"])
  links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
  links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
  links.new(ramp.outputs["Color"], vol_emit.inputs["Emission Color"])

  links.new(principled.outputs["BSDF"], out.inputs["Surface"])
  links.new(add_vol.outputs["Shader"], out.inputs["Volume"])

  # Animate mapping rotation/location for “swirl”
  mapping.inputs["Rotation"].default_value = (0.0, 0.0, 0.0)
  mapping.inputs["Location"].default_value = (0.0, 0.0, 0.0)
  mapping.inputs["Rotation"].keyframe_insert(data_path="default_value", frame=1)
  mapping.inputs["Location"].keyframe_insert(data_path="default_value", frame=1)
  mapping.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(260))
  mapping.inputs["Location"].default_value = (0.25, -0.18, 0.12)
  mapping.inputs["Rotation"].keyframe_insert(data_path="default_value", frame=180)
  mapping.inputs["Location"].keyframe_insert(data_path="default_value", frame=180)
  mapping.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(520))
  mapping.inputs["Location"].default_value = (-0.15, 0.22, -0.08)
  mapping.inputs["Rotation"].keyframe_insert(data_path="default_value", frame=360)
  mapping.inputs["Location"].keyframe_insert(data_path="default_value", frame=360)

  obj.data.materials.append(mat)

  # World (dark)
  world = bpy.data.worlds["World"]
  world.use_nodes = True
  wn = world.node_tree.nodes
  for n in list(wn):
    wn.remove(n)
  wout = wn.new("ShaderNodeOutputWorld")
  wbg = wn.new("ShaderNodeBackground")
  wbg.inputs["Color"].default_value = (0.02, 0.02, 0.02, 1.0)
  wbg.inputs["Strength"].default_value = 0.9
  world.node_tree.links.new(wbg.outputs["Background"], wout.inputs["Surface"])

  return obj


def ease_fcurves(obj):
  if not obj.animation_data or not obj.animation_data.action:
    return
  action = obj.animation_data.action
  fcurves = getattr(action, "fcurves", None)
  if not fcurves:
    return
  for fc in fcurves:
    for kp in fc.keyframe_points:
      kp.interpolation = "BEZIER"
      kp.easing = "AUTO"


def main():
  args = parse_args()
  out_path = os.path.abspath(args.out)
  os.makedirs(os.path.dirname(out_path), exist_ok=True)

  clean_scene()
  scene = bpy.context.scene

  set_render(scene, out_path=out_path, w=args.w, h=args.h, fps=60, samples=args.samples)
  make_camera(scene)
  make_lights()
  make_floor()
  blob = make_glass_blob(scene)
  ease_fcurves(blob)

  # Render animation
  bpy.ops.render.render(animation=True)


if __name__ == "__main__":
  main()

