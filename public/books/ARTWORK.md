# Book artwork

The 50 book IDs and artwork paths are in src/rooms/bookArtCatalog.json.
35 supplied images have measured crops. Other entries are pending.

For each new image, set its catalog image path relative to public, sourceAspect
(image width / height), and both normalized crop rectangles: left, top, width,
height. Measure each image separately. Save the catalog to activate that artwork.

All 50 books are inspectable without an interactive flag. Fillers never use
artwork. Only How Are You Here?! advances the story. The House Arrest second
edition uses the second supplied House Arrest image.
