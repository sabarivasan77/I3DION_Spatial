const HUB_MODEL_SOURCE_URLS: Record<string, string> = {
  'anisotropybarnlamp.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/AnisotropyBarnLamp/glTF-Binary/AnisotropyBarnLamp.glb',
  'antiquecamera.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
  'avocado.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/Avocado/glTF-Binary/Avocado.glb',
  'barramundifish.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb',
  'boombox.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/BoomBox/glTF-Binary/BoomBox.glb',
  'carconcept.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/CarConcept/glTF-Binary/CarConcept.glb',
  'cesiummilktruck.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
  'fox.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/Fox/glTF-Binary/Fox.glb',
  'glamvelvetsofa.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb',
  'iridescencelamp.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/IridescenceLamp/glTF-Binary/IridescenceLamp.glb',
  'lantern.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/Lantern/glTF-Binary/Lantern.glb',
  'materialsvariantsshoe.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
  'sheenchair.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/SheenChair/glTF-Binary/SheenChair.glb',
  'toycar.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/ToyCar/glTF-Binary/ToyCar.glb',
  'waterbottle.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/edc7c9e67c639d230715049ee31f9a96a6babbbe/Models/WaterBottle/glTF-Binary/WaterBottle.glb'
};

export function getHubModelSourceUrl(modelUrl: string): string | undefined {
  const path = modelUrl.split(/[?#]/, 1)[0];
  if (!path.includes('/models/preview/')) return undefined;

  const fileName = path.split('/').pop()?.toLowerCase();
  return fileName ? HUB_MODEL_SOURCE_URLS[fileName] : undefined;
}
