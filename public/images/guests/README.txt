Guest photographs
-----------------

Drop a photo in this folder named after the person, and it appears on their card
at /guests/ automatically. No code change, no commands.

  public/images/guests/ambrosia-brown.jpg
  public/images/guests/lance-huffman.jpg
  public/images/guests/carolyn-contreras.jpg
  public/images/guests/angela-lahman.jpg
  public/images/guests/dr-dawn-andalon.jpg
  public/images/guests/malwina-sitarz.jpg
  public/images/guests/aaron-lahman.jpg

The name must match the person's slug exactly (lower case, hyphens). .jpg, .png,
.webp and .avif all work.

Cards use a 4:3 frame and crop from the centre. If someone's face sits high or low
in the photo, set "imageFocus" on their record in src/content/people/<slug>.json —
for example "center 25%" to favour the top of the frame.

Set "imageAlt" on the same record to describe the photograph. If you leave it empty
a plain description is used instead.

Please use photographs the person has given you, or that they publish for
professional use. Anything without a photo keeps the branded fallback, which is a
perfectly good result.
