export async function loadEra(eraId) {
  try {
    const eraModule = await import(`./eras/${eraId}.js`);
    return eraModule[`${eraId}Era`];
  } catch (error) {
    console.error('Failed to load era:', eraId, error);
    return null;
  }
}
