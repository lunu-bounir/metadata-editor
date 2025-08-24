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
    'Image/ExifTool/DjVu.pm',
    'Image/ExifTool/IPTC.pm',
    'Image/ExifTool/NikonSettings.pm',
    'Image/ExifTool/DarwinCore.pm',
    'Image/ExifTool/PLIST.pm',
    'Image/ExifTool/QuickTime.pm',
    'Image/ExifTool/JPEGDigest.pm',
    'Image/ExifTool/Canon.pm',
    'Image/ExifTool/MPEG.pm',
    'Image/ExifTool/Matroska.pm',
    'Image/ExifTool/PhotoMechanic.pm',
    'Image/ExifTool/RIFF.pm',
    'Image/ExifTool/Kodak.pm',
    'Image/ExifTool/Minolta.pm',
    'Image/ExifTool/Import.pm',
    'Image/ExifTool/GeoTiff.pm',
    'Image/ExifTool/PPM.pm',
    'Image/ExifTool/Trailer.pm',
    'Image/ExifTool/APE.pm',
    'Image/ExifTool/MNG.pm',
    'Image/ExifTool/FLAC.pm',
    'Image/ExifTool/GoPro.pm',
    'Image/ExifTool/Olympus.pm',
    'Image/ExifTool/Geolocation.pm',
    'Image/ExifTool/Microsoft.pm',
    'Image/ExifTool/Ogg.pm',
    'Image/ExifTool/GPS.pm',
    'Image/ExifTool/FujiFilm.pm',
    'Image/ExifTool/Audible.pm',
    'Image/ExifTool/Shortcuts.pm',
    'Image/ExifTool/PCAP.pm',
    'Image/ExifTool/APP12.pm',
    'Image/ExifTool/HtmlDump.pm',
    'Image/ExifTool/Qualcomm.pm',
    'Image/ExifTool/MXF.pm',
    'Image/ExifTool/CanonCustom.pm',
    'Image/ExifTool/PSP.pm',
    'Image/ExifTool/MIEUnits.pod',
    'Image/ExifTool/iWork.pm',
    'Image/ExifTool/FITS.pm',
    'Image/ExifTool/BPG.pm',
    'Image/ExifTool/7Z.pm',
    'Image/ExifTool/LIF.pm',
    'Image/ExifTool/MIFF.pm',
    'Image/ExifTool/PLUS.pm',
    'Image/ExifTool/Sony.pm',
    'Image/ExifTool/WPG.pm',
    'Image/ExifTool/Palm.pm',
    'Image/ExifTool/MacOS.pm',
    'Image/ExifTool/XMPStruct.pl',
    'Image/ExifTool/Plot.pm',
    'Image/ExifTool/MISB.pm',
    'Image/ExifTool/KyoceraRaw.pm',
    'Image/ExifTool/InDesign.pm',
    'Image/ExifTool/AFCP.pm',
    'Image/ExifTool/FotoStation.pm',
    'Image/ExifTool/HTML.pm',
    'Image/ExifTool/BigTIFF.pm',
    'Image/ExifTool/CaptureOne.pm',
    'Image/ExifTool/EXE.pm',
    'Image/ExifTool/GIF.pm',
    'Image/ExifTool/QuickTimeStream.pl',
    'Image/ExifTool/MOI.pm',
    'Image/ExifTool/Stim.pm',
    'Image/ExifTool/Sanyo.pm',
    'Image/ExifTool/Vorbis.pm',
    'Image/ExifTool/H264.pm',
    'Image/ExifTool/AES.pm',
    'Image/ExifTool/Torrent.pm',
    'Image/ExifTool/Reconyx.pm',
    'Image/ExifTool/PanasonicRaw.pm',
    'Image/ExifTool/TNEF.pm',
    'Image/ExifTool/Geotag.pm',
    'Image/ExifTool/Leaf.pm',
    'Image/ExifTool/Sigma.pm',
    'Image/ExifTool/XMP.pm',
    'Image/ExifTool/WritePNG.pl',
    'Image/ExifTool/WriteExif.pl',
    'Image/ExifTool/Red.pm',
    'Image/ExifTool/PGF.pm',
    'Image/ExifTool/ITC.pm',
    'Image/ExifTool/GIMP.pm',
    'Image/ExifTool/PICT.pm',
    'Image/ExifTool/Nintendo.pm',
    'Image/ExifTool/Font.pm',
    'Image/ExifTool/FLIR.pm',
    'Image/ExifTool/SonyIDC.pm',
    'Image/ExifTool/CanonRaw.pm',
    'Image/ExifTool/WritePhotoshop.pl',
    'Image/ExifTool/Other.pm',
    'Image/ExifTool/InfiRay.pm',
    'Image/ExifTool/Real.pm',
    'Image/ExifTool/Panasonic.pm',
    'Image/ExifTool/PDF.pm',
    'Image/ExifTool/FlashPix.pm',
    'Image/ExifTool/JPEG.pm',
    'Image/ExifTool/README',
    'Image/ExifTool/GM.pm',
    'Image/ExifTool/Exif.pm',
    'Image/ExifTool/WritePDF.pl',
    'Image/ExifTool/DV.pm',
    'Image/ExifTool/Motorola.pm',
    'Image/ExifTool/JVC.pm',
    'Image/ExifTool/Lang/ja.pm',
    'Image/ExifTool/Lang/en_ca.pm',
    'Image/ExifTool/Lang/pl.pm',
    'Image/ExifTool/Lang/ko.pm',
    'Image/ExifTool/Lang/fi.pm',
    'Image/ExifTool/Lang/ru.pm',
    'Image/ExifTool/Lang/sv.pm',
    'Image/ExifTool/Lang/zh_cn.pm',
    'Image/ExifTool/Lang/fr.pm',
    'Image/ExifTool/Lang/nl.pm',
    'Image/ExifTool/Lang/cs.pm',
    'Image/ExifTool/Lang/sk.pm',
    'Image/ExifTool/Lang/it.pm',
    'Image/ExifTool/Lang/es.pm',
    'Image/ExifTool/Lang/zh_tw.pm',
    'Image/ExifTool/Lang/tr.pm',
    'Image/ExifTool/Lang/en_gb.pm',
    'Image/ExifTool/Lang/de.pm',
    'Image/ExifTool/PhaseOne.pm',
    'Image/ExifTool/BMP.pm',
    'Image/ExifTool/ZIP.pm',
    'Image/ExifTool/WriteCanonRaw.pl',
    'Image/ExifTool/Validate.pm',
    'Image/ExifTool/TagNames.pod',
    'Image/ExifTool/WritePostScript.pl',
    'Image/ExifTool/PCX.pm',
    'Image/ExifTool/Pentax.pm',
    'Image/ExifTool/RTF.pm',
    'Image/ExifTool/PNG.pm',
    'Image/ExifTool/WriteXMP.pl',
    'Image/ExifTool/Shift.pl',
    'Image/ExifTool/DPX.pm',
    'Image/ExifTool/Casio.pm',
    'Image/ExifTool/Theora.pm',
    'Image/ExifTool/Radiance.pm',
    'Image/ExifTool/ICC_Profile.pm',
    'Image/ExifTool/DNG.pm',
    'Image/ExifTool/CanonVRD.pm',
    'Image/ExifTool/Flash.pm',
    'Image/ExifTool/LNK.pm',
    'Image/ExifTool/WriteQuickTime.pl',
    'Image/ExifTool/WTV.pm',
    'Image/ExifTool/SigmaRaw.pm',
    'Image/ExifTool/HP.pm',
    'Image/ExifTool/Text.pm',
    'Image/ExifTool/Parrot.pm',
    'Image/ExifTool/Writer.pl',
    'Image/ExifTool/ID3.pm',
    'Image/ExifTool/Opus.pm',
    'Image/ExifTool/XMP2.pl',
    'Image/ExifTool/M2TS.pm',
    'Image/ExifTool/Geolocation.dat',
    'Image/ExifTool/Charset.pm',
    'Image/ExifTool/ZISRAW.pm',
    'Image/ExifTool/DICOM.pm',
    'Image/ExifTool/TagInfoXML.pm',
    'Image/ExifTool/MPC.pm',
    'Image/ExifTool/NikonCapture.pm',
    'Image/ExifTool/BZZ.pm',
    'Image/ExifTool/AIFF.pm',
    'Image/ExifTool/Jpeg2000.pm',
    'Image/ExifTool/XISF.pm',
    'Image/ExifTool/PostScript.pm',
    'Image/ExifTool/DJI.pm',
    'Image/ExifTool/Protobuf.pm',
    'Image/ExifTool/ISO.pm',
    'Image/ExifTool/NikonCustom.pm',
    'Image/ExifTool/RSRC.pm',
    'Image/ExifTool/MRC.pm',
    'Image/ExifTool/Photoshop.pm',
    'Image/ExifTool/Scalado.pm',
    'Image/ExifTool/OOXML.pm',
    'Image/ExifTool/Ricoh.pm',
    'Image/ExifTool/PhotoCD.pm',
    'Image/ExifTool/OpenEXR.pm',
    'Image/ExifTool/ICO.pm',
    'Image/ExifTool/CBOR.pm',
    'Image/ExifTool/WriteIPTC.pl',
    'Image/ExifTool/ASF.pm',
    'Image/ExifTool/MPF.pm',
    'Image/ExifTool/Lytro.pm',
    'Image/ExifTool/LigoGPS.pm',
    'Image/ExifTool/GE.pm',
    'Image/ExifTool/MIE.pm',
    'Image/ExifTool/Charset/DOSCyrillic.pm',
    'Image/ExifTool/Charset/Turkish.pm',
    'Image/ExifTool/Charset/Greek.pm',
    'Image/ExifTool/Charset/Cyrillic.pm',
    'Image/ExifTool/Charset/MacCroatian.pm',
    'Image/ExifTool/Charset/MacTurkish.pm',
    'Image/ExifTool/Charset/Baltic.pm',
    'Image/ExifTool/Charset/MacRomanian.pm',
    'Image/ExifTool/Charset/Thai.pm',
    'Image/ExifTool/Charset/PDFDoc.pm',
    'Image/ExifTool/Charset/Vietnam.pm',
    'Image/ExifTool/Charset/Latin.pm',
    'Image/ExifTool/Charset/Symbol.pm',
    'Image/ExifTool/Charset/MacCyrillic.pm',
    'Image/ExifTool/Charset/MacIceland.pm',
    'Image/ExifTool/Charset/MacGreek.pm',
    'Image/ExifTool/Charset/MacArabic.pm',
    'Image/ExifTool/Charset/Arabic.pm',
    'Image/ExifTool/Charset/DOSLatin1.pm',
    'Image/ExifTool/Charset/MacHebrew.pm',
    'Image/ExifTool/Charset/MacRoman.pm',
    'Image/ExifTool/Charset/Hebrew.pm',
    'Image/ExifTool/Charset/MacThai.pm',
    'Image/ExifTool/Charset/MacRSymbol.pm',
    'Image/ExifTool/Charset/DOSLatinUS.pm',
    'Image/ExifTool/Charset/MacChineseTW.pm',
    'Image/ExifTool/Charset/JIS.pm',
    'Image/ExifTool/Charset/MacKorean.pm',
    'Image/ExifTool/Charset/MacChineseCN.pm',
    'Image/ExifTool/Charset/MacLatin2.pm',
    'Image/ExifTool/Charset/MacJapanese.pm',
    'Image/ExifTool/Charset/Latin2.pm',
    'Image/ExifTool/Charset/ShiftJIS.pm',
    'Image/ExifTool/WriteRIFF.pl',
    'Image/ExifTool/VCard.pm',
    'Image/ExifTool/Unknown.pm',
    'Image/ExifTool/Samsung.pm',
    'Image/ExifTool/Apple.pm',
    'Image/ExifTool/Nikon.pm',
    'Image/ExifTool/Fixup.pm',
    'Image/ExifTool/BuildTagLookup.pm',
    'Image/ExifTool/Rawzor.pm',
    'Image/ExifTool/AAC.pm',
    'Image/ExifTool/PrintIM.pm',
    'Image/ExifTool/TagLookup.pm',
    'Image/ExifTool/FLIF.pm',
    'Image/ExifTool/MWG.pm',
    'Image/ExifTool/MakerNotes.pm',
    'Image/ExifTool/MinoltaRaw.pm',
    'Image/ExifTool/JSON.pm',
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
    try {
      self.alert = error => self.postMessage({
        id: request.id,
        error
      });

      self.postMessage({
        id: request.id,
        response: Perl.eval(request.code)
      });
    }
    catch (e) {
      self.postMessage({
        id: request.id,
        error: e.message
      });
    }
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

          if (!r.ok) {
            throw Error(`Status code ${r.status} while downloading ${file.href}`);
          }

          const contentLength = r.headers.get('content-length');

          // Create a blob to store the data
          const chunks = [];
          let receivedLength = 0;

          const reader = r.body.getReader();
          while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            self.postMessage({
              id: request.id,
              type: 'report',
              href: file.href,
              receivedLength,
              contentLength
            });
          }

          // Combine chunks into a single Blob
          const data = new Blob(chunks);

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
        error: e.message
      });
    }
  }
  else if (request.cmd === 'delete') {
    /* WORKER FS is readonly */

    // try {
    //   FS.unlink('/work/' + request.filename);
    // }
    // catch (e) {
    //   console.error(e);
    // }

    self.postMessage({
      id: request.id,
      response: true
    });
  }
  else if (request.cmd === 'umount') {
    FS.unmount('/work');

    self.postMessage({
      id: request.id,
      response: true
    });
  }
};
