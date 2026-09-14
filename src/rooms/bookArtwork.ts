import catalog from "./bookArtCatalog.json";
export interface Crop {left:number;top:number;width:number;height:number}
export interface BookArtwork {image:string;sourceAspect:number;coverCrop:Crop;spineCrop:Crop}
interface ArtworkEntry {image:string;sourceAspect:number|null;coverCrop:Crop|null;spineCrop:Crop|null}
// Crops are measured metadata, never inferred from a filename or at runtime.
export function artworkFor(id:string):BookArtwork|undefined {
  const entry=(catalog as Record<string,ArtworkEntry>)[id];
  if(!entry?.sourceAspect || !entry.coverCrop || !entry.spineCrop) return undefined;
  return {image:entry.image,sourceAspect:entry.sourceAspect,coverCrop:entry.coverCrop,spineCrop:entry.spineCrop};
}
