/* global FS, Perl */

class ExifTool {
  #waitings = [];
  constructor() {
    this.#prepare();
  }
  async #prepare() {
    await new Promise(resolve => Perl.init(resolve));

    // Perl.output = (str, channel) => {
    //   console[channel === 0 ? 'info' : 'error'](str);
    // };

    for (const name of ['/ExifTool', '/ExifTool/Image', '/ExifTool/Image/ExifTool', '/ExifTool/Image/ExifTool/Lang', '/ExifTool/Image/ExifTool/Charset', '/ExifTool/File']) {
      FS.mkdir(name);
    }
    const names = [
      'File/RandomAccess.pm',
      'Image/ExifTool/DjVu.pm', 'Image/ExifTool/IPTC.pm', 'Image/ExifTool/NikonSettings.pm',
      'Image/ExifTool/DarwinCore.pm', 'Image/ExifTool/PLIST.pm', 'Image/ExifTool/QuickTime.pm',
      'Image/ExifTool/JPEGDigest.pm', 'Image/ExifTool/Canon.pm', 'Image/ExifTool/MPEG.pm',
      'Image/ExifTool/Matroska.pm', 'Image/ExifTool/PhotoMechanic.pm', 'Image/ExifTool/RIFF.pm',
      'Image/ExifTool/Kodak.pm', 'Image/ExifTool/Minolta.pm', 'Image/ExifTool/Import.pm',
      'Image/ExifTool/GeoTiff.pm', 'Image/ExifTool/PPM.pm', 'Image/ExifTool/APE.pm',
      'Image/ExifTool/MNG.pm', 'Image/ExifTool/FLAC.pm', 'Image/ExifTool/GoPro.pm',
      'Image/ExifTool/Olympus.pm', 'Image/ExifTool/Microsoft.pm', 'Image/ExifTool/Ogg.pm',
      'Image/ExifTool/GPS.pm', 'Image/ExifTool/FujiFilm.pm', 'Image/ExifTool/Audible.pm',
      'Image/ExifTool/Shortcuts.pm', 'Image/ExifTool/APP12.pm', 'Image/ExifTool/HtmlDump.pm',
      'Image/ExifTool/Qualcomm.pm', 'Image/ExifTool/MXF.pm', 'Image/ExifTool/CanonCustom.pm',
      'Image/ExifTool/PSP.pm', 'Image/ExifTool/iWork.pm',
      'Image/ExifTool/FITS.pm', 'Image/ExifTool/BPG.pm', 'Image/ExifTool/LIF.pm',
      'Image/ExifTool/MIFF.pm', 'Image/ExifTool/PLUS.pm', 'Image/ExifTool/Sony.pm',
      'Image/ExifTool/Palm.pm', 'Image/ExifTool/MacOS.pm', 'Image/ExifTool/XMPStruct.pl',
      'Image/ExifTool/MISB.pm', 'Image/ExifTool/KyoceraRaw.pm', 'Image/ExifTool/InDesign.pm',
      'Image/ExifTool/AFCP.pm', 'Image/ExifTool/FotoStation.pm', 'Image/ExifTool/HTML.pm',
      'Image/ExifTool/BigTIFF.pm', 'Image/ExifTool/CaptureOne.pm', 'Image/ExifTool/EXE.pm',
      'Image/ExifTool/GIF.pm', 'Image/ExifTool/QuickTimeStream.pl', 'Image/ExifTool/MOI.pm',
      'Image/ExifTool/Stim.pm', 'Image/ExifTool/Sanyo.pm', 'Image/ExifTool/Vorbis.pm',
      'Image/ExifTool/H264.pm', 'Image/ExifTool/AES.pm', 'Image/ExifTool/Torrent.pm',
      'Image/ExifTool/Reconyx.pm', 'Image/ExifTool/PanasonicRaw.pm', 'Image/ExifTool/Geotag.pm',
      'Image/ExifTool/Leaf.pm', 'Image/ExifTool/Sigma.pm', 'Image/ExifTool/XMP.pm',
      'Image/ExifTool/WritePNG.pl', 'Image/ExifTool/WriteExif.pl', 'Image/ExifTool/Red.pm',
      'Image/ExifTool/PGF.pm', 'Image/ExifTool/ITC.pm', 'Image/ExifTool/GIMP.pm',
      'Image/ExifTool/PICT.pm', 'Image/ExifTool/Nintendo.pm', 'Image/ExifTool/Font.pm',
      'Image/ExifTool/FLIR.pm', 'Image/ExifTool/SonyIDC.pm', 'Image/ExifTool/CanonRaw.pm',
      'Image/ExifTool/WritePhotoshop.pl', 'Image/ExifTool/Other.pm', 'Image/ExifTool/Real.pm',
      'Image/ExifTool/Panasonic.pm', 'Image/ExifTool/PDF.pm', 'Image/ExifTool/FlashPix.pm',
      'Image/ExifTool/JPEG.pm', 'Image/ExifTool/Exif.pm',
      'Image/ExifTool/WritePDF.pl', 'Image/ExifTool/DV.pm', 'Image/ExifTool/Motorola.pm',
      'Image/ExifTool/JVC.pm', 'Image/ExifTool/Lang/ja.pm', 'Image/ExifTool/Lang/en_ca.pm',
      'Image/ExifTool/Lang/pl.pm', 'Image/ExifTool/Lang/ko.pm', 'Image/ExifTool/Lang/fi.pm',
      'Image/ExifTool/Lang/ru.pm', 'Image/ExifTool/Lang/sv.pm', 'Image/ExifTool/Lang/zh_cn.pm',
      'Image/ExifTool/Lang/fr.pm', 'Image/ExifTool/Lang/nl.pm', 'Image/ExifTool/Lang/cs.pm',
      'Image/ExifTool/Lang/sk.pm', 'Image/ExifTool/Lang/it.pm', 'Image/ExifTool/Lang/es.pm',
      'Image/ExifTool/Lang/zh_tw.pm', 'Image/ExifTool/Lang/tr.pm', 'Image/ExifTool/Lang/en_gb.pm',
      'Image/ExifTool/Lang/de.pm', 'Image/ExifTool/PhaseOne.pm', 'Image/ExifTool/BMP.pm',
      'Image/ExifTool/ZIP.pm', 'Image/ExifTool/WriteCanonRaw.pl', 'Image/ExifTool/Validate.pm',
      'Image/ExifTool/WritePostScript.pl', 'Image/ExifTool/PCX.pm',
      'Image/ExifTool/Pentax.pm', 'Image/ExifTool/RTF.pm', 'Image/ExifTool/PNG.pm',
      'Image/ExifTool/WriteXMP.pl', 'Image/ExifTool/Shift.pl', 'Image/ExifTool/DPX.pm',
      'Image/ExifTool/Casio.pm', 'Image/ExifTool/Theora.pm', 'Image/ExifTool/Radiance.pm',
      'Image/ExifTool/ICC_Profile.pm', 'Image/ExifTool/DNG.pm', 'Image/ExifTool/CanonVRD.pm',
      'Image/ExifTool/Flash.pm', 'Image/ExifTool/LNK.pm', 'Image/ExifTool/WriteQuickTime.pl',
      'Image/ExifTool/WTV.pm', 'Image/ExifTool/SigmaRaw.pm', 'Image/ExifTool/HP.pm',
      'Image/ExifTool/Text.pm', 'Image/ExifTool/Parrot.pm', 'Image/ExifTool/Writer.pl',
      'Image/ExifTool/ID3.pm', 'Image/ExifTool/Opus.pm', 'Image/ExifTool/XMP2.pl',
      'Image/ExifTool/M2TS.pm', 'Image/ExifTool/Charset.pm', 'Image/ExifTool/ZISRAW.pm',
      'Image/ExifTool/DICOM.pm', 'Image/ExifTool/TagInfoXML.pm', 'Image/ExifTool/MPC.pm',
      'Image/ExifTool/NikonCapture.pm', 'Image/ExifTool/BZZ.pm', 'Image/ExifTool/AIFF.pm',
      'Image/ExifTool/Jpeg2000.pm', 'Image/ExifTool/PostScript.pm', 'Image/ExifTool/DJI.pm',
      'Image/ExifTool/ISO.pm', 'Image/ExifTool/NikonCustom.pm', 'Image/ExifTool/RSRC.pm',
      'Image/ExifTool/MRC.pm', 'Image/ExifTool/Photoshop.pm', 'Image/ExifTool/Scalado.pm',
      'Image/ExifTool/OOXML.pm', 'Image/ExifTool/Ricoh.pm', 'Image/ExifTool/PhotoCD.pm',
      'Image/ExifTool/OpenEXR.pm', 'Image/ExifTool/ICO.pm', 'Image/ExifTool/CBOR.pm',
      'Image/ExifTool/WriteIPTC.pl', 'Image/ExifTool/ASF.pm', 'Image/ExifTool/MPF.pm',
      'Image/ExifTool/Lytro.pm', 'Image/ExifTool/GE.pm', 'Image/ExifTool/MIE.pm',
      'Image/ExifTool/WriteRIFF.pl', 'Image/ExifTool/VCard.pm', 'Image/ExifTool/Unknown.pm',
      'Image/ExifTool/Samsung.pm', 'Image/ExifTool/Apple.pm', 'Image/ExifTool/Nikon.pm',
      'Image/ExifTool/Fixup.pm', 'Image/ExifTool/BuildTagLookup.pm', 'Image/ExifTool/Rawzor.pm',
      'Image/ExifTool/PrintIM.pm', 'Image/ExifTool/TagLookup.pm', 'Image/ExifTool/FLIF.pm',
      'Image/ExifTool/MWG.pm', 'Image/ExifTool/MakerNotes.pm', 'Image/ExifTool/MinoltaRaw.pm',
      'Image/ExifTool/JSON.pm', 'Image/ExifTool.pm'
    ];
    for (const name of names) {
      const data = await fetch('ExifTool/' + name).then(r => r.arrayBuffer());
      FS.writeFile('/ExifTool/' + name, new Uint8Array(data), {encoding: 'binary'});
    }
    Perl.start(['-e', `use lib '/ExifTool'; use Image::ExifTool;`]);
    for (const c of this.#waitings) {
      c();
    }
    this.#waitings.length = 0;
  }
  execute(code) {
    return Perl.eval(code);
  }
  async upload(file, max = 100 * 1024) {
    const r = new Response(file.slice(0, max));
    const ab = await r.arrayBuffer();
    FS.writeFile(`/home/${file.name}`, new Uint8Array(ab));
  }
  delete(file) {
    FS.unlink(`/home/${file.name}`);
  }
  ready() {
    if (Perl.state === 'Running') {
      return Promise.resolve();
    }
    return new Promise(resolve => this.#waitings.push(resolve));
  }
}
