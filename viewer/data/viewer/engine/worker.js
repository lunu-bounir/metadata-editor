/* global FS, WORKERFS, Perl */

// polyfill to run webperl in worker
self.window = self;
self.alert = e => console.log(e);
self.document = {
  getElementsByTagName() {
    return [{
      src: location.href,
      appendChild(e) {
        if (e.src.endsWith('emperl.js')) {
          self.importScripts('webperl/emperl.js');
        }
      }
    }];
  },
  createElement() {
    return {};
  }
};
XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
  apply(target, self, args) {
    args[1] = args[1].replace('viewer/engine', 'viewer/engine/webperl');
    return Reflect.apply(target, self, args);
  }
});

self.importScripts('webperl/webperl.js');

Perl.init(() => {
  for (const name of [
    '/work', '/ExifTool', '/ExifTool/Image', '/ExifTool/Image/ExifTool', '/ExifTool/Image/ExifTool/Lang',
    '/ExifTool/Image/ExifTool/Charset', '/ExifTool/File'
  ]) {
    FS.mkdir(name);
  }

  const names = [
    'File/RandomAccess.pm',
    'File/RandomAccess.pod',
    'Image/ExifTool/7Z.pm',
    'Image/ExifTool/AAC.pm',
    'Image/ExifTool/AES.pm',
    'Image/ExifTool/AFCP.pm',
    'Image/ExifTool/AIFF.pm',
    'Image/ExifTool/APE.pm',
    'Image/ExifTool/APP12.pm',
    'Image/ExifTool/ASF.pm',
    'Image/ExifTool/Apple.pm',
    'Image/ExifTool/Audible.pm',
    'Image/ExifTool/BMP.pm',
    'Image/ExifTool/BPG.pm',
    'Image/ExifTool/BZZ.pm',
    'Image/ExifTool/BigTIFF.pm',
    'Image/ExifTool/BuildTagLookup.pm',
    'Image/ExifTool/CBOR.pm',
    'Image/ExifTool/Canon.pm',
    'Image/ExifTool/CanonCustom.pm',
    'Image/ExifTool/CanonRaw.pm',
    'Image/ExifTool/CanonVRD.pm',
    'Image/ExifTool/CaptureOne.pm',
    'Image/ExifTool/Casio.pm',
    'Image/ExifTool/Charset.pm',
    'Image/ExifTool/DICOM.pm',
    'Image/ExifTool/DJI.pm',
    'Image/ExifTool/DNG.pm',
    'Image/ExifTool/DPX.pm',
    'Image/ExifTool/DV.pm',
    'Image/ExifTool/DarwinCore.pm',
    'Image/ExifTool/DjVu.pm',
    'Image/ExifTool/EXE.pm',
    'Image/ExifTool/Exif.pm',
    'Image/ExifTool/FITS.pm',
    'Image/ExifTool/FLAC.pm',
    'Image/ExifTool/FLIF.pm',
    'Image/ExifTool/FLIR.pm',
    'Image/ExifTool/Fixup.pm',
    'Image/ExifTool/Flash.pm',
    'Image/ExifTool/FlashPix.pm',
    'Image/ExifTool/Font.pm',
    'Image/ExifTool/FotoStation.pm',
    'Image/ExifTool/FujiFilm.pm',
    'Image/ExifTool/GE.pm',
    'Image/ExifTool/GIF.pm',
    'Image/ExifTool/GIMP.pm',
    'Image/ExifTool/GM.pm',
    'Image/ExifTool/GPS.pm',
    'Image/ExifTool/GeoTiff.pm',
    'Image/ExifTool/Geolocation.dat',
    'Image/ExifTool/Geolocation.pm',
    'Image/ExifTool/Geotag.pm',
    'Image/ExifTool/GoPro.pm',
    'Image/ExifTool/H264.pm',
    'Image/ExifTool/HP.pm',
    'Image/ExifTool/HTML.pm',
    'Image/ExifTool/HtmlDump.pm',
    'Image/ExifTool/ICC_Profile.pm',
    'Image/ExifTool/ICO.pm',
    'Image/ExifTool/ID3.pm',
    'Image/ExifTool/IPTC.pm',
    'Image/ExifTool/ISO.pm',
    'Image/ExifTool/ITC.pm',
    'Image/ExifTool/Import.pm',
    'Image/ExifTool/InDesign.pm',
    'Image/ExifTool/InfiRay.pm',
    'Image/ExifTool/JPEG.pm',
    'Image/ExifTool/JPEGDigest.pm',
    'Image/ExifTool/JSON.pm',
    'Image/ExifTool/JVC.pm',
    'Image/ExifTool/Jpeg2000.pm',
    'Image/ExifTool/Kodak.pm',
    'Image/ExifTool/KyoceraRaw.pm',
    'Image/ExifTool/LIF.pm',
    'Image/ExifTool/LNK.pm',
    'Image/ExifTool/Leaf.pm',
    'Image/ExifTool/Lytro.pm',
    'Image/ExifTool/M2TS.pm',
    'Image/ExifTool/MIE.pm',
    'Image/ExifTool/MIEUnits.pod',
    'Image/ExifTool/MIFF.pm',
    'Image/ExifTool/MISB.pm',
    'Image/ExifTool/MNG.pm',
    'Image/ExifTool/MOI.pm',
    'Image/ExifTool/MPC.pm',
    'Image/ExifTool/MPEG.pm',
    'Image/ExifTool/MPF.pm',
    'Image/ExifTool/MRC.pm',
    'Image/ExifTool/MWG.pm',
    'Image/ExifTool/MXF.pm',
    'Image/ExifTool/MacOS.pm',
    'Image/ExifTool/MakerNotes.pm',
    'Image/ExifTool/Matroska.pm',
    'Image/ExifTool/Microsoft.pm',
    'Image/ExifTool/Minolta.pm',
    'Image/ExifTool/MinoltaRaw.pm',
    'Image/ExifTool/Motorola.pm',
    'Image/ExifTool/Nikon.pm',
    'Image/ExifTool/NikonCapture.pm',
    'Image/ExifTool/NikonCustom.pm',
    'Image/ExifTool/NikonSettings.pm',
    'Image/ExifTool/Nintendo.pm',
    'Image/ExifTool/OOXML.pm',
    'Image/ExifTool/Ogg.pm',
    'Image/ExifTool/Olympus.pm',
    'Image/ExifTool/OpenEXR.pm',
    'Image/ExifTool/Opus.pm',
    'Image/ExifTool/Other.pm',
    'Image/ExifTool/PCX.pm',
    'Image/ExifTool/PDF.pm',
    'Image/ExifTool/PGF.pm',
    'Image/ExifTool/PICT.pm',
    'Image/ExifTool/PLIST.pm',
    'Image/ExifTool/PLUS.pm',
    'Image/ExifTool/PNG.pm',
    'Image/ExifTool/PPM.pm',
    'Image/ExifTool/PSP.pm',
    'Image/ExifTool/Palm.pm',
    'Image/ExifTool/Panasonic.pm',
    'Image/ExifTool/PanasonicRaw.pm',
    'Image/ExifTool/Parrot.pm',
    'Image/ExifTool/Pentax.pm',
    'Image/ExifTool/PhaseOne.pm',
    'Image/ExifTool/PhotoCD.pm',
    'Image/ExifTool/PhotoMechanic.pm',
    'Image/ExifTool/Photoshop.pm',
    'Image/ExifTool/PostScript.pm',
    'Image/ExifTool/PrintIM.pm',
    'Image/ExifTool/Protobuf.pm',
    'Image/ExifTool/Qualcomm.pm',
    'Image/ExifTool/QuickTime.pm',
    'Image/ExifTool/QuickTimeStream.pl',
    'Image/ExifTool/README',
    'Image/ExifTool/RIFF.pm',
    'Image/ExifTool/RSRC.pm',
    'Image/ExifTool/RTF.pm',
    'Image/ExifTool/Radiance.pm',
    'Image/ExifTool/Rawzor.pm',
    'Image/ExifTool/Real.pm',
    'Image/ExifTool/Reconyx.pm',
    'Image/ExifTool/Red.pm',
    'Image/ExifTool/Ricoh.pm',
    'Image/ExifTool/Samsung.pm',
    'Image/ExifTool/Sanyo.pm',
    'Image/ExifTool/Scalado.pm',
    'Image/ExifTool/Shift.pl',
    'Image/ExifTool/Shortcuts.pm',
    'Image/ExifTool/Sigma.pm',
    'Image/ExifTool/SigmaRaw.pm',
    'Image/ExifTool/Sony.pm',
    'Image/ExifTool/SonyIDC.pm',
    'Image/ExifTool/Stim.pm',
    'Image/ExifTool/TagInfoXML.pm',
    'Image/ExifTool/TagLookup.pm',
    'Image/ExifTool/TagNames.pod',
    'Image/ExifTool/Text.pm',
    'Image/ExifTool/Theora.pm',
    'Image/ExifTool/Torrent.pm',
    'Image/ExifTool/Unknown.pm',
    'Image/ExifTool/VCard.pm',
    'Image/ExifTool/Validate.pm',
    'Image/ExifTool/Vorbis.pm',
    'Image/ExifTool/WPG.pm',
    'Image/ExifTool/WTV.pm',
    'Image/ExifTool/WriteCanonRaw.pl',
    'Image/ExifTool/WriteExif.pl',
    'Image/ExifTool/WriteIPTC.pl',
    'Image/ExifTool/WritePDF.pl',
    'Image/ExifTool/WritePNG.pl',
    'Image/ExifTool/WritePhotoshop.pl',
    'Image/ExifTool/WritePostScript.pl',
    'Image/ExifTool/WriteQuickTime.pl',
    'Image/ExifTool/WriteRIFF.pl',
    'Image/ExifTool/WriteXMP.pl',
    'Image/ExifTool/Writer.pl',
    'Image/ExifTool/XISF.pm',
    'Image/ExifTool/XMP.pm',
    'Image/ExifTool/XMP2.pl',
    'Image/ExifTool/XMPStruct.pl',
    'Image/ExifTool/ZIP.pm',
    'Image/ExifTool/ZISRAW.pm',
    'Image/ExifTool/iWork.pm',
    'Image/ExifTool/Charset/Arabic.pm',
    'Image/ExifTool/Charset/Baltic.pm',
    'Image/ExifTool/Charset/Cyrillic.pm',
    'Image/ExifTool/Charset/DOSCyrillic.pm',
    'Image/ExifTool/Charset/DOSLatin1.pm',
    'Image/ExifTool/Charset/DOSLatinUS.pm',
    'Image/ExifTool/Charset/Greek.pm',
    'Image/ExifTool/Charset/Hebrew.pm',
    'Image/ExifTool/Charset/JIS.pm',
    'Image/ExifTool/Charset/Latin.pm',
    'Image/ExifTool/Charset/Latin2.pm',
    'Image/ExifTool/Charset/MacArabic.pm',
    'Image/ExifTool/Charset/MacChineseCN.pm',
    'Image/ExifTool/Charset/MacChineseTW.pm',
    'Image/ExifTool/Charset/MacCroatian.pm',
    'Image/ExifTool/Charset/MacCyrillic.pm',
    'Image/ExifTool/Charset/MacGreek.pm',
    'Image/ExifTool/Charset/MacHebrew.pm',
    'Image/ExifTool/Charset/MacIceland.pm',
    'Image/ExifTool/Charset/MacJapanese.pm',
    'Image/ExifTool/Charset/MacKorean.pm',
    'Image/ExifTool/Charset/MacLatin2.pm',
    'Image/ExifTool/Charset/MacRSymbol.pm',
    'Image/ExifTool/Charset/MacRoman.pm',
    'Image/ExifTool/Charset/MacRomanian.pm',
    'Image/ExifTool/Charset/MacThai.pm',
    'Image/ExifTool/Charset/MacTurkish.pm',
    'Image/ExifTool/Charset/PDFDoc.pm',
    'Image/ExifTool/Charset/ShiftJIS.pm',
    'Image/ExifTool/Charset/Symbol.pm',
    'Image/ExifTool/Charset/Thai.pm',
    'Image/ExifTool/Charset/Turkish.pm',
    'Image/ExifTool/Charset/Vietnam.pm',
    'Image/ExifTool.pod',
    'Image/ExifTool.pm'
  ];
  for (const v of names) {
    const p = v.split('/');
    const name = p.pop();

    FS.createLazyFile('/ExifTool/' + p.join('/'), name, './ExifTool/' + v, true, false);
  }


  Perl.start(['-e', `use lib '/ExifTool'; use Image::ExifTool;`]);
  self.postMessage({
    cmd: 'ready'
  });
});

self.onmessage = async e => {
  const request = e.data;

  if (request.cmd === 'execute') {
    self.postMessage({
      id: request.id,
      response: Perl.eval(request.code)
    });
  }
  else if (request.cmd === 'upload') {
    try {
      // console.log(FS.analyzePath('/work'));
      if (FS.analyzePath('/work').object?.mount?.mountpoint === '/work') {
        FS.unmount('/work');
      }

      const blobs = [];
      const files = [];
      for (const file of request.files) {
        if (file.type === 'remote') {
          const r = await fetch(file.href).catch(e => {
            throw Error(e.message + ': ' + file.href);
          });
          const data = await r.blob();
          blobs.push({
            name: file.name,
            data
          });
        }
        else {
          files.push(file);
        }
      }

      FS.mount(WORKERFS, {
        blobs,
        files
      }, '/work');

      self.postMessage({
        id: request.id,
        response: true
      });
    }
    catch (e) {
      console.error(e);

      self.postMessage({
        id: request.id,
        response: e.message
      });
    }
  }
  else if (request.cmd === 'umount') {
    FS.unmount('/work');

    self.postMessage({
      id: request.id,
      response: true
    });
  }
};
