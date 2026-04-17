function decodeUplink(input) {
  var bytes = input.bytes;
  var fPort = input.fPort;

  var decoded = {};
  var pos = 0;
  var type;

  function decodeSigned16(b1, b2) {
    var value = (b1 << 8) | b2;
    if (value & 0x8000) {
      value = value - 0x10000;
    }
    return value;
  }

  function toHex(byteArray) {
    var hex = "";
    for (var i = 0; i < byteArray.length; i++) {
      var h = byteArray[i].toString(16);
      if (h.length < 2) {
        h = "0" + h;
      }
      hex += h;
    }
    return hex;
  }

  function decodeFrame(type, target) {
    switch (type & 0x7f) {
      case 0:
        target.emptyFrame = {};
        break;

      case 1:
        target.battery = bytes[pos++];
        break;

      case 2:
        target.temperature = {};
        target.temperature.value = decodeSigned16(bytes[pos++], bytes[pos++]) / 10;
        break;

      case 3:
        target.tempAlarm = {};
        target.tempAlarm.highAlarm = !!(bytes[pos] & 0x01);
        target.tempAlarm.lowAlarm = !!(bytes[pos] & 0x02);
        pos++;
        break;

      case 4:
        target.averageTemperature = {};
        target.averageTemperature.value = decodeSigned16(bytes[pos++], bytes[pos++]) / 10;
        break;

      case 5:
        target.avgTempAlarm = {};
        target.avgTempAlarm.highAlarm = !!(bytes[pos] & 0x01);
        target.avgTempAlarm.lowAlarm = !!(bytes[pos] & 0x02);
        pos++;
        break;

      case 6:
        target.humidity = {};
        target.humidity.value = bytes[pos++] / 2;
        break;

      case 7:
        target.lux = {};
        target.lux.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 8:
        target.lux2 = {};
        target.lux2.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 9:
        target.door = {};
        target.door.value = !!bytes[pos++];
        break;

      case 10:
        target.doorAlarm = {};
        target.doorAlarm.value = !!bytes[pos++];
        break;

      case 11:
        target.tamperReport = {};
        target.tamperReport.value = !!bytes[pos++];
        break;

      case 12:
        target.tamperAlarm = {};
        target.tamperAlarm.value = !!bytes[pos++];
        break;

      case 13:
        target.flood = {};
        target.flood.value = bytes[pos++];
        break;

      case 14:
        target.floodAlarm = {};
        target.floodAlarm.value = !!bytes[pos++];
        break;

      case 15:
        target.oilAlarm = {};
        target.oilAlarm.value = bytes[pos];

        target.foilAlarm = {};
        target.foilAlarm.value = !!bytes[pos++];
        break;

      case 16:
        target.userSwitch1Alarm = {};
        target.userSwitch1Alarm.value = !!bytes[pos++];
        break;

      case 17:
        target.doorCount = {};
        target.doorCount.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 18:
        target.presence = {};
        target.presence.value = !!bytes[pos++];
        break;

      case 19:
        target.IRproximity = {};
        target.IRproximity.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 20:
        target.IRcloseproximity = {};
        target.IRcloseproximity.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 21:
        target.closeProximityAlarm = {};
        target.closeProximityAlarm.value = !!bytes[pos++];
        break;

      case 22:
        target.disinfectAlarm = {};
        target.disinfectAlarm.value = bytes[pos++];

        if (target.disinfectAlarm.value === 0) target.disinfectAlarm.state = "dirty";
        if (target.disinfectAlarm.value === 1) target.disinfectAlarm.state = "occupied";
        if (target.disinfectAlarm.value === 2) target.disinfectAlarm.state = "cleaning";
        if (target.disinfectAlarm.value === 3) target.disinfectAlarm.state = "clean";
        break;

      case 80:
        target.humidity = {};
        target.humidity.value = bytes[pos++] / 2;

        target.temperature = {};
        target.temperature.value = decodeSigned16(bytes[pos++], bytes[pos++]) / 10;
        break;

      case 81:
        target.humidity = {};
        target.humidity.value = bytes[pos++] / 2;

        target.averageTemperature = {};
        target.averageTemperature.value = decodeSigned16(bytes[pos++], bytes[pos++]) / 10;
        break;

      case 82:
        target.door = {};
        target.door.value = !!bytes[pos++];

        target.temperature = {};
        target.temperature.value = decodeSigned16(bytes[pos++], bytes[pos++]) / 10;
        break;

      case 110:
        target.CheckInConfirmed = {
          version: toHex([
            bytes[pos++],
            bytes[pos++],
            bytes[pos++],
            bytes[pos++]
          ]),
          idddata: toHex([
            bytes[pos++],
            bytes[pos++],
            bytes[pos++],
            bytes[pos++]
          ])
        };
        break;

      case 112:
        target.capacitanceFlood = {};
        target.capacitanceFlood.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 113:
        target.capacitancePad = {};
        target.capacitancePad.value = (bytes[pos++] << 8) | bytes[pos++];
        break;

      case 114:
        target.capacitanceEnd = {};
        target.capacitanceEnd.value = (bytes[pos++] << 8) | bytes[pos++];
        break;
    }
  }

  switch (fPort) {
    case 1:
      if (bytes.length < 2) {
        return {
          errors: ["Wrong length of RX package"]
        };
      }

      decoded.historyStart = (bytes[pos++] << 8) | bytes[pos++];
      decoded.prevHistSeqNr = decoded.historyStart;

      while (pos < bytes.length) {
        type = bytes[pos++];
        if (type & 0x80) {
          decoded.prevHistSeqNr--;
        }
        decodeFrame(type, decoded);
      }
      break;

    case 2:
      var now = new Date();
      decoded.history = {};

      if (bytes.length < 2) {
        return {
          errors: ["Wrong length of RX package"]
        };
      }

      var seqNr = (bytes[pos++] << 8) | bytes[pos++];

      while (pos < bytes.length) {
        decoded.history[seqNr] = {};

        var secondsAgo =
          (bytes[pos++] << 24) |
          (bytes[pos++] << 16) |
          (bytes[pos++] << 8) |
          bytes[pos++];

        decoded.history[seqNr].timeStamp = new Date(
          now.getTime() - secondsAgo * 1000
        ).toUTCString();

        type = bytes[pos++];
        decodeFrame(type, decoded.history[seqNr]);
        seqNr++;
      }
      break;

    case 11:
      if (bytes.length !== 2 || bytes[0] !== 0x03) {
        return { data: {} };
      }

      switch (bytes[1]) {
        case 0:
          decoded.downlinkStatus = "OK";
          break;
        case 1:
          decoded.downlinkStatus = "Bad settings";
          break;
        case 2:
          decoded.downlinkStatus = "Bad payload length";
          break;
        case 3:
          decoded.downlinkStatus = "Value not accepted";
          break;
        case 4:
          decoded.downlinkStatus = "Unknown command";
          break;
        default:
          return { data: {} };
      }
      break;

    default:
      return {
        errors: ["Unsupported fPort: " + fPort]
      };
  }

  return {
    data: decoded
  };
}
